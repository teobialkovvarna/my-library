import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, Plus, Trash2, LibraryBig, BookOpen, X, Loader2, Camera,
  Globe, BookUp, Send, MapPin, ThumbsUp, Search, Info
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const fileInputRef = useRef(null);

  const [newBook, setNewBook] = useState({
    title: '', author: '', customImages: [], isPublic: true, isAvailable: false
  });

  // --- AI (API) СЪСТОЯНИЯ ---
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'title' или 'author'
  const [hasSearched, setHasSearched] = useState(false); // Индикатор дали търсенето е приключило

  const [requestBookModal, setRequestBookModal] = useState(null);
  const [exchangeMessage, setExchangeMessage] = useState('');

  const [communityFeed, setCommunityFeed] = useState([
    {
      id: 101, userName: "Стелиян Стефанов", userAvatar: "СС", action: "предлага за заемане",
      bookTitle: "Времеубежище", bookAuthor: "Георги Господинов", coverUrl: "https://covers.openlibrary.org/b/id/10521270-M.jpg",
      review: "Свободна е, ако някой иска да я заеме за няколко седмици!", likes: 12, timeAgo: "преди 2 часа",
      isAvailable: true, location: "Варна (Бизнес Парк)"
    }
  ]);

  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    setLoading(false);
  }, []);

  // --- ИНТЕГРАЦИЯ С GOOGLE BOOKS API ---
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
        const searchQuery = activeField === 'title' ? query : `inauthor:"${query}"`;
        const safeQuery = encodeURIComponent(searchQuery);
        
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${safeQuery}&maxResults=8`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const results = data.items.map(item => ({
            id: item.id,
            title: item.volumeInfo.title || '',
            author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Неизвестен автор',
            coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null
          }));
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Грешка при търсене:", error);
        setSuggestions([]);
      }
      
      setIsFetchingInfo(false);
      setHasSearched(true);
    };

    const delayTimer = setTimeout(fetchBooksInfo, 800);
    return () => clearTimeout(delayTimer);
  }, [newBook.title, newBook.author, activeField]);

  const handleSelectSuggestion = (suggestion) => {
    setNewBook(prev => ({
      ...prev,
      title: suggestion.title,
      author: suggestion.author,
      customImages: suggestion.coverUrl ? [suggestion.coverUrl] : prev.customImages
    }));
    setSuggestions([]);
    setActiveField(null);
    setHasSearched(false);
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    setIsAdding(true);

    setTimeout(() => {
      const bookToAdd = { 
        ...newBook, 
        id: Date.now(), 
        coverUrl: newBook.customImages[0] || null
      };

      const updatedBooks = [bookToAdd, ...books];
      setBooks(updatedBooks);
      localStorage.setItem('my_local_library', JSON.stringify(updatedBooks));
      
      setNewBook({ title: '', author: '', customImages: [], isPublic: true, isAvailable: false });
      setIsAdding(false);
    }, 600);
  };

  const handleDeleteBook = (id) => {
    const updatedBooks = books.filter(b => b.id !== id);
    setBooks(updatedBooks);
    localStorage.setItem('my_local_library', JSON.stringify(updatedBooks));
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all bg-indigo-600 text-white shadow-md" : "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}>
              <LibraryBig size={20} /> Моята Библиотека
            </button>
            <button onClick={() => setActiveTab('feed')} className={activeTab === 'feed' ? "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all bg-emerald-600 text-white shadow-md" : "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-slate-500 hover:text-emerald-600 hover:bg-slate-50"}>
              <Globe size={20} /> Общност и Размяна
            </button>
          </div>
        </div>

        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-8">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Plus size={20} className="text-indigo-600" /> Добави книга</h2>
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file) {
                       const reader = new FileReader();
                       reader.onload = (ev) => setNewBook(prev => ({...prev, customImages: [ev.target.result]}));
                       reader.readAsDataURL(file);
                    }
                  }} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <Camera size={16} /> Снимай
                  </button>
                </div>
                
                {newBook.customImages[0] && (
                   <div className="mb-4 relative w-24 h-32 mx-auto rounded-lg overflow-hidden shadow-md border border-slate-200">
                      <img src={newBook.customImages[0]} alt="Корица" className="w-full h-full object-cover" />
                      <button onClick={() => setNewBook(prev => ({...prev, customImages: []}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                   </div>
                )}

                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Заглавие</label>
                    <input type="text" required value={newBook.title} 
                      onChange={(e) => { setNewBook({...newBook, title: e.target.value}); setActiveField('title'); }} 
                      onFocus={() => { if(newBook.title) setActiveField('title'); }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Напр. Граф Монте Кристо"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Автор</label>
                    <input type="text" required value={newBook.author} 
                      onChange={(e) => { setNewBook({...newBook, author: e.target.value}); setActiveField('author'); }} 
                      onFocus={() => { if(newBook.author) setActiveField('author'); }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Напр. Александър Дюма"
                    />
                  </div>

                  {/* ПОДОБРЕНО ПАДАЩО МЕНЮ С ОБРАТНА ВРЪЗКА */}
                  {activeField && (newBook[activeField]?.length >= 3) && (
                    <div className="absolute z-20 w-full max-w-sm bg-white border border-slate-200 mt-[-10px] rounded-xl shadow-2xl overflow-hidden">
                      {isFetchingInfo ? (
                        <div className="px-4 py-6 text-slate-500 text-sm flex items-center justify-center gap-2 bg-slate-50">
                          <Loader2 size={18} className="animate-spin text-indigo-500" /> Търсене в интернет...
                        </div>
                      ) : suggestions.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto">
                          <li className="px-4 py-2 bg-indigo-50 text-xs font-bold text-indigo-800 flex items-center gap-1"><Search size={12}/> Намерени книги:</li>
                          {suggestions.map((suggestion, index) => (
                            <li key={index} onClick={() => handleSelectSuggestion(suggestion)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex gap-3 items-center transition-colors">
                              {suggestion.coverUrl ? (
                                <img src={suggestion.coverUrl} className="w-8 h-12 object-cover rounded shadow-sm" alt="cover"/>
                              ) : (
                                <div className="w-8 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-400"><Book size={14}/></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{suggestion.title}</p>
                                <p className="text-xs text-slate-500 truncate">{suggestion.author}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : hasSearched ? (
                        <div className="px-4 py-6 text-slate-500 text-sm flex flex-col items-center justify-center gap-2 bg-slate-50 text-center">
                          <Info size={24} className="text-slate-400" />
                          <p>Няма намерени резултати.</p>
                          <p className="text-xs text-slate-400">Опитай да напишеш заглавието по друг начин.</p>
                        </div>
                      ) : null}
                      
                      <button type="button" onClick={() => {setSuggestions([]); setActiveField(null); setHasSearched(false);}} className="w-full py-2 bg-slate-100 text-xs text-slate-500 hover:bg-slate-200 font-medium border-t border-slate-200">Затвори менюто</button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 relative z-0">
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer" onClick={() => setNewBook({...newBook, isPublic: !newBook.isPublic})}>
                      <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-indigo-900">Публична</span><input type="checkbox" checked={newBook.isPublic} readOnly className="w-3 h-3 text-indigo-600 rounded" /></div>
                    </div>
                    <div className={newBook.isAvailable ? "p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl cursor-pointer" : "p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer"} onClick={() => { if(newBook.isPublic) setNewBook({...newBook, isAvailable: !newBook.isAvailable}) }}>
                       <div className="flex justify-between items-center mb-1"><span className={newBook.isAvailable ? "text-xs font-bold text-emerald-900" : "text-xs font-bold text-slate-500"}>Давам я</span><input type="checkbox" checked={newBook.isAvailable} disabled={!newBook.isPublic} readOnly className="w-3 h-3 text-emerald-600 rounded" /></div>
                    </div>
                  </div>

                  <button type="submit" disabled={isAdding} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                    {isAdding ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />} Запази
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.length === 0 && <div className="col-span-2 text-center text-slate-400 py-12">Библиотеката е празна. Опитай да потърсиш книга!</div>}
                {books.map((book) => {
                  return (
                    <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 relative flex overflow-hidden h-36 hover:shadow-md transition-shadow">
                      <div className="w-24 bg-slate-100 flex-shrink-0 flex items-center justify-center border-r border-slate-100">
                        {book.coverUrl ? <img src={book.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <Book size={24} className="text-slate-300" />}
                      </div>
                      <div className="p-4 flex flex-col flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 pr-2">
                            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">{book.title}</h3>
                            <p className="text-slate-600 text-xs truncate">{book.author}</p>
                          </div>
                          <button onClick={() => handleDeleteBook(book.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0"><Trash2 size={16}/></button>
                        </div>
                        <div className="mt-auto flex gap-2">
                          {book.isPublic && <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded font-medium">Публична</span>}
                          {book.isAvailable && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded font-medium">За заемане</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
