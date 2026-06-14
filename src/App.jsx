import React, { useState, useEffect, useRef } from 'react';
import { Book, Plus, Trash2, LibraryBig, BookOpen, X, Loader2, Camera, Globe, Search, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef(null);

  const [newBook, setNewBook] = useState({ title: '', author: '', customImages: [], isPublic: true, isAvailable: false });
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    setLoading(false);
  }, []);

  // --- ТАЗИ ЧАСТ Е КРИТИЧНАТА ---
  useEffect(() => {
    const fetchBooksInfo = async () => {
      const query = activeField === 'title' ? newBook.title : newBook.author;
      if (!query || query.trim().length < 3 || !activeField) {
        setSuggestions([]);
        setHasSearched(false);
        return;
      }
      setIsFetchingInfo(true);
      setHasSearched(false);
      try {
        const safeQuery = encodeURIComponent(query);
        const url = activeField === 'title' 
          ? `https://openlibrary.org/search.json?title=${safeQuery}&limit=8`
          : `https://openlibrary.org/search.json?author=${safeQuery}&limit=8`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.docs && data.docs.length > 0) {
          setSuggestions(data.docs.map(doc => ({
            id: doc.key,
            title: doc.title,
            author: doc.author_name ? doc.author_name[0] : 'Неизвестен автор',
            coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null
          })));
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        setSuggestions([]);
      }
      setIsFetchingInfo(false);
      setHasSearched(true);
    };
    const delayTimer = setTimeout(fetchBooksInfo, 800);
    return () => clearTimeout(delayTimer);
  }, [newBook.title, newBook.author, activeField]);

  // ... (останалата част от функциите за handleAddBook и рендерирането остават същите) ...
  // Увери се, че имаш и логиката за рендериране на падащото меню, която показах по-рано!
  
  return (
    // Тук идва твоят JSX код за визуализация
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Твоят интерфейс */}
    </div>
  );
}
