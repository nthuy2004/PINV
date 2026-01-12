'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
} from 'firebase/firestore';
import {
    Plus,
    Check,
    Trash2,
    Clock,
    Calendar,
    Tag,
    GripVertical,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Todo {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Timestamp;
    category?: string;
    createdAt: Timestamp;
}

const priorityColors = {
    low: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function TodoList() {
    const { user } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        priority: 'medium' as const,
        dueDate: '',
        category: '',
    });

    useEffect(() => {
        if (!user) return;

        const todosQuery = query(
            collection(db, 'todos'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
            const todosData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Todo[];
            setTodos(todosData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addTodo = async () => {
        if (!user || !newTodo.title.trim()) return;

        try {
            await addDoc(collection(db, 'todos'), {
                userId: user.uid,
                title: newTodo.title.trim(),
                description: newTodo.description.trim() || null,
                completed: false,
                priority: newTodo.priority,
                dueDate: newTodo.dueDate ? Timestamp.fromDate(new Date(newTodo.dueDate)) : null,
                category: newTodo.category.trim() || null,
                createdAt: Timestamp.now(),
            });

            setNewTodo({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                category: '',
            });
            setShowForm(false);
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const toggleTodo = async (todo: Todo) => {
        try {
            await updateDoc(doc(db, 'todos', todo.id), {
                completed: !todo.completed,
            });
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const deleteTodo = async (todoId: string) => {
        try {
            await deleteDoc(doc(db, 'todos', todoId));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const incompleteTodos = todos.filter((t) => !t.completed);
    const completedTodos = todos.filter((t) => t.completed);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="spinner w-6 h-6 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">TO-DO LIST</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="mb-4 p-4 bg-dark-50 dark:bg-dark-700 rounded-xl space-y-3">
                    <input
                        type="text"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        placeholder="Tiêu đề công việc..."
                        className="input"
                    />
                    <textarea
                        value={newTodo.description}
                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        placeholder="Mô tả (tùy chọn)..."
                        className="input min-h-16 resize-none"
                    />
                    <div className="flex gap-2">
                        <select
                            value={newTodo.priority}
                            onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                            className="input flex-1"
                        >
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                        </select>
                        <input
                            type="date"
                            value={newTodo.dueDate}
                            onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                            className="input flex-1"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-2 bg-dark-200 dark:bg-dark-600 rounded-lg hover:bg-dark-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={addTodo}
                            disabled={!newTodo.title.trim()}
                            className="flex-1 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-400 disabled:opacity-50"
                        >
                            Thêm
                        </button>
                    </div>
                </div>
            )}

            {/* Todo items */}
            <div className="space-y-2">
                {incompleteTodos.length === 0 && completedTodos.length === 0 && (
                    <p className="text-center text-dark-500 py-4">
                        Chưa có công việc nào. Thêm công việc đầu tiên!
                    </p>
                )}

                {incompleteTodos.map((todo) => (
                    <div
                        key={todo.id}
                        className="flex items-start gap-3 p-3 bg-dark-50 dark:bg-dark-700/50 rounded-xl group"
                    >
                        <button
                            onClick={() => toggleTodo(todo)}
                            className="w-5 h-5 mt-0.5 border-2 border-dark-300 dark:border-dark-500 rounded-md hover:border-primary-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium">{todo.title}</p>
                            {todo.description && (
                                <p className="text-sm text-dark-500 mt-0.5">{todo.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn('px-2 py-0.5 text-xs rounded-full', priorityColors[todo.priority])}>
                                    {todo.priority === 'high' ? 'Cao' : todo.priority === 'medium' ? 'TB' : 'Thấp'}
                                </span>
                                {todo.dueDate && (
                                    <span className="flex items-center gap-1 text-xs text-dark-500">
                                        <Clock className="w-3 h-3" />
                                        {todo.dueDate.toDate().toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-accent-100 dark:hover:bg-accent-900/30 rounded-lg text-accent-300"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Completed */}
                {completedTodos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
                        <p className="text-sm text-dark-500 mb-2">
                            Đã hoàn thành ({completedTodos.length})
                        </p>
                        {completedTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className="flex items-center gap-3 p-2 opacity-60 group"
                            >
                                <button
                                    onClick={() => toggleTodo(todo)}
                                    className="w-5 h-5 bg-primary-500 rounded-md flex items-center justify-center shrink-0"
                                >
                                    <Check className="w-3 h-3 text-dark-900" />
                                </button>
                                <p className="flex-1 line-through text-dark-500">{todo.title}</p>
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-accent-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
