import React, { useState, useEffect, useRef } from 'react';
import { Book, Plus, Trash2, LibraryBig, Globe, Loader2, Camera, BookOpen, X, BookUp, Send, MapPin, ThumbsUp } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef(null);

  // Първоначално зареждане
  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
    setLoading(false);
  }, []);

  const handleAddBook = (e) => {
    e.preventDefault();
    // Тук можеш да добавиш логика за събиране на данни от формата
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      alert("Книгата е запазена!");
    }, 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Зареждане...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Моята Библиотека</h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab('library')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'library' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
            Библиотека
          </button>
          <button onClick={() => setActiveTab('feed')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'feed' ? 'bg-emerald-600 text-white' : 'bg-white'}`}>
            Общност
          </button>
        </div>

        {activeTab === 'library' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Добре дошъл в твоята библиотека!</h2>
            <p>Тук ще се появяват твоите книги, след като ги добавиш.</p>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Общност</h2>
            <p>Виж какво четат останалите.</p>
          </div>
        )}
      </div>
    </div>
  );
}
