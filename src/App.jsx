import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, Plus, Trash2, LibraryBig, BookOpen, X, Loader2, Camera,
  Globe, BookUp, Send, MapPin, ThumbsUp
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // AI Състояния (Симулация)
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [titleAuthors, setTitleAuthors] = useState([]);
  const [isFetchingAuthors, setIsFetchingAuthors] = useState(false);
  
  const fileInputRef = useRef(null);

  const [newBook, setNewBook] = useState({
    title: '', author: '', customImages: [], isPublic: true, isAvailable: false
  });

  const [requestBookModal, setRequestBookModal] = useState(null);
  const [exchangeMessage, setExchangeMessage] = useState('');

  const [communityFeed, setCommunityFeed] = useState([
    {
      id: 101, userName: "Стелиян Стефанов", userAvatar: "СС", action: "предлага за заемане",
      bookTitle: "Времеубежище", bookAuthor: "Георги Господинов", coverUrl: "https://covers.openlibrary.org/b/id/10521270-M.jpg",
      review: "Свободна е, ако някой иска да я заеме за няколко седмици!", likes: 12, timeAgo: "преди 2 часа",
      isAvailable: true, location: "Варна (Бизнес Парк)"
    },
    {
      id: 102, userName: "Мартин Петров", userAvatar: "МП", action: "добави в библиотеката си",
      bookTitle: "Дюн", bookAuthor: "Франк Хърбърт", coverUrl: "https://covers.openlibrary.org/b/id/12836269-M.jpg",
      review: "", likes: 5, timeAgo: "преди 5 часа",
      isAvailable: false, location: null
    }
  ]);

  useEffect(() => {
    const savedBooks = localStorage.getItem('my_local_library');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchAuthors = () => {
      const title = newBook.title.trim().toLowerCase();
      if (title.length < 3) { setTitleAuthors([]); return; }
      setIsFetchingAuthors(true);
      setTimeout(() => {
        if (title.includes('захапи')) setTitleAuthors(['Тери Пратчет']);
        else if (title.includes('време')) setTitleAuthors(['Георги Господинов']);
        else if (title.includes('под игото')) setTitleAuthors(['Иван Вазов']);
        else setTitleAuthors(['Неизвестен автор (AI Симулация)']);
        setIsFetchingAuthors(false);
      }, 800);
    };
    const debounceTimer = setTimeout(fetchAuthors, 800);
    return () => clearTimeout(debounceTimer);
  }, [newBook.title]);

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
      
      if (newBook.isPublic) {
        const newFeedPost = {
          id: Date.now() + 1, userName: "Ти (Теодоси)", userAvatar: "Т", action: newBook.isAvailable ? "предлага за заемане" : "добави в библиотеката си",
          bookTitle: newBook.title, bookAuthor: newBook.author, coverUrl: bookToAdd.coverUrl,
          likes: 0, timeAgo: "току-що", isAvailable: newBook.isAvailable, location: newBook.isAvailable ? "Варна (Център)" : null
        };
        setCommunityFeed([newFeedPost, ...communityFeed]);
      }
      
      setNewBook({ title: '', author: '', customImages: [], isPublic: true, isAvailable: false });
      setIsAdding(false);
    }, 600);
  };

  const handleDeleteBook = (id) => {
    const updatedBooks = books.filter(b => b.id !== id);
    setBooks(updatedBooks);
    localStorage.setItem('my_local_library', JSON.stringify(updatedBooks));
  };

  const handleSendRequest = () => {
    alert("Съобщението до " + requestBookModal.userName + " е изпратено успешно!");
    setRequestBookModal(null); setExchangeMessage('');
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
                
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Заглавие</label>
                    <input type="text" required value={newBook.title} onChange={(e) => setNewBook({...newBook, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Автор</label>
                    <input type="text" required value={newBook.author} onChange={(e) => { setNewBook({...newBook, author: e.target.value}); setShowAuthorSuggestions(true); }} onFocus={() => setShowAuthorSuggestions(true)} onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    {showAuthorSuggestions && (titleAuthors.length > 0 || isFetchingAuthors) && (
                      <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {isFetchingAuthors && <li className="px-4 py-3 text-slate-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Търсене...</li>}
                        {!isFetchingAuthors && titleAuthors.map((author, index) => (
                          <li key={index} onClick={() => { setNewBook({...newBook, author: author}); setShowAuthorSuggestions(false); }} className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-50">{author}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
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
                {books.length === 0 && <div className="col-span-2 text-center text-slate-400 py-12">Библиотеката е празна. Добави първата си книга!</div>}
                {books.map((book) => {
                  return (
                    <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 relative flex overflow-hidden h-36">
                      <div className="w-24 bg-slate-100 flex-shrink-0 flex items-center justify-center border-r border-slate-100">
                        {book.coverUrl ? <img src={book.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <Book size={24} className="text-slate-300" />}
                      </div>
                      <div className="p-4 flex flex-col flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{book.title}</h3>
                            <p className="text-slate-600 text-xs truncate">{book.author}</p>
                          </div>
                          <button onClick={() => handleDeleteBook(book.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <div className="mt-auto flex gap-2">
                          {book.isPublic && <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-medium">Публична</span>}
                          {book.isAvailable && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-medium">За заемане</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto animate-in fade-in space-y-6">
            {communityFeed.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
                {post.isAvailable && <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><BookUp size={14} /> Свободна</div>}
                
                <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-700">{post.userAvatar}</div>
                  <div>
                    <p className="text-sm"><span className="font-bold">{post.userName}</span> <span className="text-slate-500">{post.action}</span></p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">{post.timeAgo} {post.location && <>• <MapPin size={10} /> {post.location}</>}</p>
                  </div>
                </div>

                <div className="p-5 flex gap-4">
                  {post.coverUrl ? <img src={post.coverUrl} alt="cover" className="w-20 h-28 object-cover rounded-lg shadow-sm" /> : <div className="w-20 h-28 bg-slate-100 rounded-lg flex items-center justify-center"><Book size={24} className="text-slate-300"/></div>}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{post.bookTitle}</h3>
                    <p className="text-sm font-medium text-slate-600 mb-2">{post.bookAuthor}</p>
                    {post.review && <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg italic">"{post.review}"</p>}
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  {post.isAvailable ? (
                    <button onClick={() => setRequestBookModal(post)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><BookUp size={18} /> Поискай за четене</button>
                  ) : (
                    <div className="flex gap-4 text-sm font-medium text-slate-500"><span className="flex gap-1 items-center"><ThumbsUp size={16}/> {post.likes}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {requestBookModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between bg-emerald-50">
              <h3 className="font-bold text-emerald-900 flex items-center gap-2"><BookUp size={18} /> Уговорка</h3>
              <button onClick={() => setRequestBookModal(null)} className="text-emerald-700"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="font-bold mb-4">{requestBookModal.bookTitle}</p>
              <textarea value={exchangeMessage} onChange={(e) => setExchangeMessage(e.target.value)} placeholder={"Здравей! Искам да заема книгата. Удобно ли е да се видим?"} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-28 text-sm"></textarea>
              <button onClick={handleSendRequest} className="w-full bg-emerald-600 text-white py-3 rounded-xl mt-4 flex justify-center gap-2"><Send size={18} /> Изпрати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
