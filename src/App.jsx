import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, Plus, Trash2, LibraryBig, BookOpen, X, Loader2, Camera,
  Globe, BookUp, Send, MapPin, ThumbsUp, Search, Info, Edit3, ScanText
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const fileInputRef = useRef(null);

  // Обновено състояние на книгата с новите полета
  const [newBook, setNewBook] = useState({
    title: '', author: '', publisher: '', year: '', genre: '', description: '',
    customImages: [], isPublic: true, isAvailable: false
  });

  const [editingId, setEditingId] = useState(null); // За редакция
  const [searchMyBooks, setSearchMyBooks] = useState(''); // За търсене в моите книги

  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [activeField, setActiveField] = useState(null); 
  const [hasSearched, setHasSearched] = useState(false); 
  const [isScanning, setIsScanning] = useState(false); // За OCR

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

  // Зареждане от паметта
  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    setInitialLoad(false);
    setLoading(false);
  }, []);

  // Автоматично запазване при всяка промяна
  useEffect(() => {
    if (!initialLoad) {
      localStorage.setItem('my_local_library', JSON.stringify(books));
    }
  }, [books, initialLoad]);

  // Търсачка с Open Library
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
          const results = data.docs.map(doc => ({
            id: doc.key,
            title: doc.title,
            author: doc.author_name ? doc.author_name[0] : 'Неизвестен автор',
            year: doc.first_publish_year ? doc.first_publish_year.toString() : '',
            publisher: doc.publisher ? doc.publisher[0] : '',
            coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null
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
      year: suggestion.year,
      publisher: suggestion.publisher,
      customImages: suggestion.coverUrl ? [suggestion.coverUrl] : prev.customImages
    }));
    setSuggestions([]);
    setActiveField(null);
    setHasSearched(false);
  };

  // Разпознаване на текст от снимка (OCR)
  const handleScanText = async () => {
    if (!newBook.customImages[0]) return;
    setIsScanning(true);
    try {
      // Зареждаме Tesseract.js динамично, за да не чупим Netlify
      if (!window.Tesseract) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const result = await window.Tesseract.recognize(newBook.customImages[0], 'bul+eng');
      const extractedText = result.data.text.trim();
      
      if(extractedText) {
        setNewBook(prev => ({
          ...prev, 
          description: prev.description ? prev.description + '\n\n--- Сканиран текст ---\n' + extractedText : '--- Сканиран текст ---\n' + extractedText
        }));
      } else {
        alert("Не успях да разпозная текст на тази снимка. Опитай да снимаш по-отблизо.");
      }
    } catch (error) {
      console.error(error);
      alert("Възникна грешка при сканирането.");
    }
    setIsScanning(false);
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    setIsAdding(true);

    setTimeout(() => {
      if (editingId) {
        // Редактиране на съществуваща
        setBooks(books.map(b => b.id === editingId ? { ...newBook, id: editingId, coverUrl: newBook.customImages[0] || b.coverUrl } : b));
        setEditingId(null);
      } else {
        // Добавяне на нова
        const bookToAdd = { 
          ...newBook, 
          id: Date.now(), 
          coverUrl: newBook.customImages[0] || null
        };
        setBooks([bookToAdd, ...books]);
      }
      
      setNewBook({ title: '', author: '', publisher: '', year: '', genre: '', description: '', customImages: [], isPublic: true, isAvailable: false });
      setIsAdding(false);
    }, 600);
  };

  const handleEditBook = (book) => {
    setNewBook({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      year: book.year || '',
      genre: book.genre || '',
      description: book.description || '',
      customImages: book.coverUrl ? [book.coverUrl] : [],
      isPublic: book.isPublic || false,
      isAvailable: book.isAvailable || false
    });
    setEditingId(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = (id) => {
    if(window.confirm("Сигурен ли си, че искаш да изтриеш тази книга?")) {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const cancelEdit = () => {
    setNewBook({ title: '', author: '', publisher: '', year: '', genre: '', description: '', customImages: [], isPublic: true, isAvailable: false });
    setEditingId(null);
  };

  // Филтриране на книгите
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchMyBooks.toLowerCase()) || 
    b.author.toLowerCase().includes(searchMyBooks.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex flex-wrap justify-center">
            <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all bg-indigo-600 text-white shadow-md" : "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}>
              <LibraryBig size={20} /> Моята Библиотека
            </button>
            <button onClick={() => setActiveTab('feed')} className={activeTab === 'feed' ? "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all bg-emerald-600 text-white shadow-md" : "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-slate-500 hover:text-emerald-600 hover:bg-slate-50"}>
              <Globe size={20} /> Общност и Размяна
            </button>
          </div>
        </div>

        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
            {/* ФОРМА ЗА ДОБАВЯНЕ/РЕДАКЦИЯ */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-8">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {editingId ? <Edit3 size={20} className="text-amber-500" /> : <Plus size={20} className="text-indigo-600" />} 
                    {editingId ? "Редакция на книга" : "Добави книга"}
                  </h2>
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
                   <div className="mb-4">
                     <div className="relative w-24 h-32 mx-auto rounded-lg overflow-hidden shadow-md border border-slate-200">
                        <img src={newBook.customImages[0]} alt="Корица" className="w-full h-full object-cover" />
                        <button onClick={() => setNewBook(prev => ({...prev, customImages: []}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                     </div>
                     <button onClick={handleScanText} disabled={isScanning} className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanText size={16} />} 
                        {isScanning ? "Разпознаване..." : "Извлечи текст от снимката"}
                     </button>
                   </div>
                )}

                <form onSubmit={handleAddBook} className="space-y-4">
                  {/* ОСНОВНИ ПОЛЕТА */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Заглавие *</label>
                    <input type="text" required value={newBook.title} onChange={(e) => { setNewBook({...newBook, title: e.target.value}); setActiveField('title'); }} onFocus={() => setActiveField('title')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Автор *</label>
                    <input type="text" required value={newBook.author} onChange={(e) => { setNewBook({...newBook, author: e.target.value}); setActiveField('author'); }} onFocus={() => setActiveField('author')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>

                  {activeField && (newBook[activeField]?.length >= 3) && (
                    <div className="absolute z-20 w-full max-w-sm bg-white border border-slate-200 mt-[-10px] rounded-xl shadow-2xl overflow-hidden">
                      {isFetchingInfo ? (
                        <div className="px-4 py-6 text-slate-500 text-sm flex items-center justify-center gap-2 bg-slate-50"><Loader2 size={18} className="animate-spin text-indigo-500" /> Търсене...</div>
                      ) : suggestions.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <li key={index} onClick={() => handleSelectSuggestion(suggestion)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex gap-3 items-center">
                              {suggestion.coverUrl ? <img src={suggestion.coverUrl} className="w-8 h-12 object-cover rounded shadow-sm" alt="cover"/> : <div className="w-8 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-400"><Book size={14}/></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{suggestion.title}</p>
                                <p className="text-xs text-slate-500 truncate">{suggestion.author}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : hasSearched ? (
                        <div className="px-4 py-4 text-slate-500 text-sm text-center bg-slate-50"><p>Няма намерени резултати.</p></div>
                      ) : null}
                      <button type="button" onClick={() => {setSuggestions([]); setActiveField(null); setHasSearched(false);}} className="w-full py-2 bg-slate-100 text-xs text-slate-500 hover:bg-slate-200 font-medium">Затвори менюто</button>
                    </div>
                  )}

                  {/* ДОПЪЛНИТЕЛНИ ПОЛЕТА */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Издателство</label>
                      <input type="text" value={newBook.publisher} onChange={(e) => setNewBook({...newBook, publisher: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Година</label>
                      <input type="number" value={newBook.year} onChange={(e) => setNewBook({...newBook, year: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Жанр</label>
                    <input type="text" value={newBook.genre} onChange={(e) => setNewBook({...newBook, genre: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" placeholder="напр. Фантастика, Роман" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Описание / Бележки</label>
                    <textarea value={newBook.description} onChange={(e) => setNewBook({...newBook, description: e.target.value})} rows="3" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm resize-none"></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer" onClick={() => setNewBook({...newBook, isPublic: !newBook.isPublic})}>
                      <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-indigo-900">Публична</span><input type="checkbox" checked={newBook.isPublic} readOnly className="w-3 h-3 text-indigo-600 rounded" /></div>
                    </div>
                    <div className={newBook.isAvailable ? "p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl cursor-pointer" : "p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer"} onClick={() => { if(newBook.isPublic) setNewBook({...newBook, isAvailable: !newBook.isAvailable}) }}>
                       <div className="flex justify-between items-center mb-1"><span className={newBook.isAvailable ? "text-xs font-bold text-emerald-900" : "text-xs font-bold text-slate-500"}>Давам я</span><input type="checkbox" checked={newBook.isAvailable} disabled={!newBook.isPublic} readOnly className="w-3 h-3 text-emerald-600 rounded" /></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 rounded-xl transition-colors">
                        Отказ
                      </button>
                    )}
                    <button type="submit" disabled={isAdding} className={`flex-1 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}>
                      {isAdding ? <Loader2 size={18} className="animate-spin" /> : (editingId ? <Edit3 size={18}/> : <BookOpen size={18} />)} 
                      {editingId ? "Обнови" : "Запази"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* СПИСЪК С КНИГИ И ТЪРСАЧКА */}
            <div className="lg:col-span-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
                <Search size={20} className="text-slate-400" />
                <input 
                  type="text" 
                  value={searchMyBooks}
                  onChange={(e) => setSearchMyBooks(e.target.value)}
                  placeholder="Търси в твоята библиотека по заглавие или автор..." 
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {searchMyBooks && <button onClick={() => setSearchMyBooks('')}><X size={16} className="text-slate-400"/></button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBooks.length === 0 && <div className="col-span-full text-center text-slate-400 py-12">Няма намерени книги.</div>}
                
                {filteredBooks.map((book) => {
                  return (
                    <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 relative flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="flex h-36">
                        <div className="w-24 bg-slate-100 flex-shrink-0 flex items-center justify-center border-r border-slate-100 relative">
                          {book.coverUrl ? <img src={book.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <Book size={24} className="text-slate-300" />}
                        </div>
                        <div className="p-4 flex flex-col flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 pr-2">
                              <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">{book.title}</h3>
                              <p className="text-slate-600 text-xs truncate">{book.author}</p>
                              {book.year && <p className="text-slate-400 text-[10px] mt-1">{book.year} {book.publisher && `• ${book.publisher}`}</p>}
                            </div>
                          </div>
                          <div className="mt-auto flex gap-2">
                            {book.isPublic && <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded font-medium">Публична</span>}
                            {book.isAvailable && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded font-medium">За заемане</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Бутони за редакция и триене - показват се при ховър (или винаги на мобилни) */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                        <button onClick={() => handleEditBook(book)} className="p-1.5 text-slate-500 hover:text-amber-500 rounded bg-white"><Edit3 size={14}/></button>
                        <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 text-slate-500 hover:text-red-500 rounded bg-white"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ... (Социалният фийд остава същият) */}
      </div>
    </div>
  );
}
