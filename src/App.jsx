import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, LibraryBig, Globe, Loader2, Camera, BookOpen, X, BookUp, Send, MapPin, ThumbsUp } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Зареждане на дизайна (Tailwind CSS)
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Зареждане на запазените книги
  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Зареждане...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-900">Моята Библиотека</h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab('library')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-md transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:text-indigo-600'}`}>
            <LibraryBig size={20} /> Библиотека
          </button>
          <button onClick={() => setActiveTab('feed')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-md transition-all ${activeTab === 'feed' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:text-emerald-600'}`}>
            <Globe size={20} /> Общност
          </button>
        </div>

        {activeTab === 'library' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <BookOpen size={48} className="mx-auto text-indigo-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Добре дошъл в твоята библиотека!</h2>
            <p className="text-slate-500">Тук ще се появяват твоите книги, след като ги добавиш.</p>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <Globe size={48} className="mx-auto text-emerald-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Общност за размяна</h2>
            <p className="text-slate-500">Скоро тук ще виждаш какво четат останалите във Варна.</p>
          </div>
        )}
      </div>
    </div>
  );
}
