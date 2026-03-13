const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
};

try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (e) {
    console.error("Firebase init error:", e);
    process.exit(1);
}

const db = getFirestore();
const auth = getAuth();

const universities = ["Đại học Bách Khoa Hà Nội", "Đại học Quốc gia Hà Nội", "Đại học Kinh tế Quốc dân", "Đại học Ngoại thương"];
const majors = ["Công nghệ thông tin", "Quản trị kinh doanh", "Kinh tế quốc tế", "Kỹ thuật ô tô"];
const interests = ["Coding", "Reading", "Music", "Sports", "Traveling", "Photography"];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
};

async function seedData() {
    console.log('🌱 Starting seed...');

    const createdUserUids = [];

    // 1. Create 20 Users
    for (let i = 1; i <= 20; i++) {
        const email = `testuser${i}@example.com`;
        const password = 'password123';
        const displayName = `Test User ${i}`;

        try {
            let uid;
            try {
                const existingUser = await auth.getUserByEmail(email);
                await auth.deleteUser(existingUser.uid);
                console.log(`Deleted existing user: ${email}`);
            } catch (e) {}

            const userRecord = await auth.createUser({
                email: email,
                password: password,
                displayName: displayName,
            });
            uid = userRecord.uid;

            const userData = {
                uid: uid,
                email: email,
                displayName: displayName,
                school: randomItem(universities),
                class: randomItem(majors),
                studentId: `SV${Math.floor(Math.random() * 100000)}`,
                bio: `Hi, I am Test User ${i} looking for study partners!`,
                interests: randomItems(interests, 3),
                location: 'Hà Nội',
                createdAt: Timestamp.now(),
                premium: false,
                tokenBalance: 100,
                avatar: `https://ui-avatars.com/api/?name=Test+User+${i}&background=random`
            };

            await db.collection('users').doc(uid).set(userData);
            createdUserUids.push(uid);
            console.log(`✅ Created User ${i}: ${uid}`);

        } catch (error) {
            console.error(`❌ Error creating user ${i}:`, error.message);
        }
    }

    // 2. We need a target test user
    const testAdminEmail = 'hochanh@test.com'; // This must match whatever user we are logged in as in the browser, or we create a new one.
    let targetUid = '';
    try{
        const userRec = await auth.getUserByEmail(testAdminEmail);
        targetUid = userRec.uid;
        console.log(`Found target test user ${testAdminEmail} with UID: ${targetUid}`);
    } catch {
       const userRecord = await auth.createUser({
            email: testAdminEmail,
            password: 'password123',
            displayName: 'Test Subagent User',
       });
       await db.collection('users').doc(userRecord.uid).set({
           uid: userRecord.uid,
           email: testAdminEmail,
           displayName: 'Test Subagent User',
           avatar: `https://ui-avatars.com/api/?name=Test+Subagent+User&background=random`,
           createdAt: Timestamp.now(),
       });
       targetUid = userRecord.uid;
       console.log(`Created new target test user ${testAdminEmail} with UID: ${targetUid}`);
    }

    // 3. Create Matches between 'targetUid' and 5 random created users
    console.log(`\n💞 Creating matches for ${testAdminEmail}...`);
    const matchTargets = randomItems(createdUserUids, 5);

    for (const partnerUid of matchTargets) {
        const matchRef = db.collection('matches').doc();
        const matchData = {
            users: [targetUid, partnerUid],
            timestamp: Timestamp.now()
        };
        await matchRef.set(matchData);
        console.log(`✅ Created Match between ${targetUid} and ${partnerUid}`);
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
}

seedData();
