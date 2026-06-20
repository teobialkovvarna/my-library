import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
  Book, Plus, Trash2, LibraryBig, BookOpen, X, Loader2, Camera,
  Globe, BookUp, Send, MapPin, ThumbsUp, Search, Info, Edit3, ScanText
} from 'lucide-react';

// Твоите Firebase ключове
const firebaseConfig = {
  apiKey: "AIzaSyDPmKDJRS7fyAbU6tDFXpNp3UOjyHYE2ks",
  authDomain: "my-home-library-80de4.firebaseapp.com",
  projectId: "my-home-library-80de4",
  storageBucket: "my-home-library-80de4.firebasestorage.app",
  messagingSenderId: "596828459314",
  appId: "1:596828459314:web:e60bd5d9aae274ad07472b"
};

// Стартиране на базата данни
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LOCAL_BULGARIAN_DB = [
  { 
    title: "Скалният крал", author: "Карл Май", year: "1980", publisher: "Отечество", genre: "Приключенски роман",
    description: "Въведена директно от Chitanka.info. Класически приключенски роман от Карл Май."
  },
  { 
    title: "Тримата мускетари", author: "Александър Дюма", year: "1844", publisher: "Георги Бакалов", genre: "Исторически роман",
    description: "Вечната класика на Александър Дюма за Атос, Портос, Арамис и д'Артанян."
  },
  { 
    title: "Граф Монте Кристо", author: "Александър Дюма", year: "1844", publisher: "Труд", genre: "Роман",
    description: "Историята на Едмон Дантес и неговото отмъщение."
  },
  { 
    title: "Повест за истинския човек", author: "Борис Полевой", year: "1946", publisher: "Народна култура", genre: "Военна повест",
    description: "Повест за съветския летец Алексей Мересиев."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const fileInputRef = useRef(null);

  const [newBook, setNewBook] = useState({
    title: '', author: '', publisher: '', year: '', genre: '', description: '',
    customImages: [], isPublic: true, isAvailable: false
  });

  const [editingId, setEditingId] = useState(null);
  const [searchMyBooks, setSearchMyBooks] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [activeField, setActiveField] = useState(null); 
  const [hasSearched, setHasSearched] = useState(false); 
  const [isScanning, setIsScanning] = useState(false);

  // ИЗТЕГЛЯНЕ НА КНИГИТЕ ОТ ОБЛАКА (ФИРЕБЕЙС)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "global_books"));
        const booksArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Сортиране - най-новите първи
        booksArray.sort((a, b) => b.createdAt - a.createdAt);
        setBooks(booksArray);
      } catch (error) {
        console.error("Грешка при теглене от базата: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

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

      const localMatches = LOCAL_BULGARIAN_DB.filter(b => {
        const target = activeField === 'title' ? b.title : b.author;
        return target.toLowerCase().includes(query.toLowerCase());
      }).map((b, i) => ({
        id: `local-${i}`, title: b.title, author: b.author, year: b.year, publisher: b.publisher,
        genre: b.genre, description: b.description, coverUrl: null, isLocal: true
      }));

      try {
        const safeQuery = encodeURIComponent(query);
        let apiResults = [];

        const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${safeQuery}&maxResults=5`);
        const gbData = await gbResponse.json();

        if (gbData.items && gbData.items.length > 0) {
          apiResults = gbData.items.map(item => ({
            id: item.id, title: item.volumeInfo.title || '',
            author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Неизвестен автор',
            year: item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.substring(0,4) : '',
            publisher: item.volumeInfo.publisher || '',
            coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            isLocal: false
          }));
        }

        setSuggestions([...localMatches, ...apiResults]);
      } catch (error) {
        setSuggestions(localMatches); 
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
      title: suggestion.title, author: suggestion.author, year: suggestion.year || '',
      publisher: suggestion.publisher || '', genre: suggestion.genre || '', description: suggestion.description || '',
      customImages: suggestion.coverUrl ? [suggestion.coverUrl] : prev.customImages
    }));
    setSuggestions([]);
    setActiveField(null);
    setHasSearched(false);
  };

  const handleScanText = async () => {
    if (newBook.customImages.length === 0) return;
    setIsScanning(true);
    try {
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
      }
    } catch (error) {
      console.error(error);
    }
    setIsScanning(false);
  };

  // ЗАПАЗВАНЕ В ОБЛАКА
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    setIsAdding(true);

    const bookDataToSave = {
      title: newBook.title,
      author: newBook.author,
      publisher: newBook.publisher,
      year: newBook.year,
      genre: newBook.genre,
      description: newBook.description,
      coverUrl: newBook.customImages[0] || null,
      customImages: newBook.customImages,
      isPublic: newBook.isPublic,
      isAvailable: newBook.isAvailable,
      createdAt: Date.now()
    };

    try {
      if (editingId) {
        const bookRef = doc(db, "global_books", editingId);
        await updateDoc(bookRef, bookDataToSave);
        setBooks(books.map(b => b.id === editingId ? { ...bookDataToSave, id: editingId } : b));
        setEditingId(null);
      } else {
        const docRef = await addDoc(collection(db, "global_books"), bookDataToSave);
        setBooks([{ ...bookDataToSave, id: docRef.id }, ...books]);
      }
      
      setNewBook({ title: '', author: '', publisher: '', year: '', genre: '', description: '', customImages: [], isPublic: true, isAvailable: false });
    } catch (error) {
      console.error("Грешка при запис в базата:", error);
      alert("Възникна грешка при запазването.");
    }

    setIsAdding(false);
  };

  const handleEditBook = (book) => {
    setNewBook({
      title: book.title || '', author: book.author || '', publisher: book.publisher || '',
      year: book.year || '', genre: book.genre || '', description: book.description || '',
      customImages: book.customImages || (book.coverUrl ? [book.coverUrl] : []),
      isPublic: book.isPublic || false, isAvailable: book.isAvailable || false
    });
    setEditingId(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ТРИЕНЕ ОТ ОБЛАКА
  const handleDeleteBook = async (id) => {
    if(window.confirm("Сигурен ли си, че искаш да изтриеш тази книга завинаги?")) {
      try {
        await deleteDoc(doc(db, "global_books", id));
        setBooks(books.filter(b => b.id !== id));
      } catch (error) {
        console.error("Грешка при триене:", error);
      }
    }
  };

  const cancelEdit = () => {
    setNewBook({ title: '', author: '', publisher: '', year: '', genre: '', description: '', customImages: [], isPublic: true, isAvailable: false });
    setEditingId(null);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchMyBooks.toLowerCase()) || 
    b.author.toLowerCase().includes(searchMyBooks.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all bg-indigo-600 text-white shadow-md" : "flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}>
              <LibraryBig size={20} /> Моята Библиотека
            </button>
          </div>
        </div>

        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
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
                       if (newBook.customImages.length >= 5) { alert("Максимум 5 снимки."); return; }
                       const reader = new FileReader();
                       reader.onload = (ev) => setNewBook(prev => ({...prev, customImages: [...prev.customImages, ev.target.result]}));
                       reader.readAsDataURL(file);
                    }
                  }} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                    <Camera size={16} /> Снимай
                  </button>
                </div>
                
                {newBook.customImages.length > 0 && (
                   <div className="mb-4">
                     <div className="flex gap-3 overflow-x-auto pb-2">
                       {newBook.customImages.map((img, idx) => (
                         <div key={idx} className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-md border border-slate-200">
                            <img src={img} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setNewBook(prev => ({...prev, customImages: prev.customImages.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                         </div>
                       ))}
                     </div>
                     <button type="button" onClick={handleScanText} disabled={isScanning} className="mt-3 w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanText size={16} />} Текст от снимка
                     </button>
                   </div>
                )}

                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Заглавие *</label>
                    <input type="text" required value={newBook.title} onChange={(e) => { setNewBook({...newBook, title: e.target.value}); setActiveField('title'); }} onFocus={() => setActiveField('title')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Автор *</label>
                    <input type="text" required value={newBook.author} onChange={(e) => { setNewBook({...newBook, author: e.target.value}); setActiveField('author'); }} onFocus={() => setActiveField('author')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                  </div>

                  {activeField && (newBook[activeField]?.length >= 3) && (
                    <div className="absolute z-20 w-full max-w-sm bg-white border border-slate-200 mt-[-10px] rounded-xl shadow-2xl overflow-hidden">
                      {isFetchingInfo ? (
                        <div className="px-4 py-6 text-slate-500 text-sm flex justify-center gap-2 bg-slate-50"><Loader2 size={18} className="animate-spin text-indigo-500" /> Търсене...</div>
                      ) : suggestions.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <li key={index} onClick={() => handleSelectSuggestion(suggestion)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex gap-3 items-center">
                              {suggestion.coverUrl ? <img src={suggestion.coverUrl} className="w-8 h-12 object-cover rounded shadow-sm" alt="cover"/> : <div className="w-8 h-12 bg-slate-200 rounded flex items-center justify-center text-slate-400"><Book size={14}/></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  {suggestion.title}
                                  {suggestion.isLocal && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded ml-2 font-medium">БГ База</span>}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{suggestion.author}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : hasSearched ? (
                        <div className="px-4 py-4 text-slate-500 text-sm text-center bg-slate-50"><p>Няма намерени резултати.</p></div>
                      ) : null}
                      <button type="button" onClick={() => {setSuggestions([]); setActiveField(null); setHasSearched(false);}} className="w-full py-2 bg-slate-100 text-xs text-slate-500 hover:bg-slate-200 font-medium border-t border-slate-200">Затвори менюто</button>
                    </div>
                  )}

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
                    <input type="text" value={newBook.genre} onChange={(e) => setNewBook({...newBook, genre: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Описание</label>
                    <textarea value={newBook.description} onChange={(e) => setNewBook({...newBook, description: e.target.value})} rows="3" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm resize-none"></textarea>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingId && <button type="button" onClick={cancelEdit} className="w-1/3 bg-slate-200 text-slate-700 font-medium py-3 rounded-xl">Отказ</button>}
                    <button type="submit" disabled={isAdding} className={`flex-1 ${editingId ? 'bg-amber-500' : 'bg-indigo-600'} text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2`}>
                      {isAdding ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />} {editingId ? "Обнови" : "Запази"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
                <Search size={20} className="text-slate-400" />
                <input type="text" value={searchMyBooks} onChange={(e) => setSearchMyBooks(e.target.value)} placeholder="Търси в твоята библиотека..." className="flex-1 bg-transparent outline-none text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 relative flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="flex h-36">
                      <div className="w-24 bg-slate-100 flex-shrink-0 flex items-center justify-center border-r border-slate-100 relative">
                        {book.coverUrl ? <img src={book.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <Book size={24} className="text-slate-300" />}
                      </div>
                      <div className="p-4 flex flex-col flex-grow min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">{book.title}</h3>
                        <p className="text-slate-600 text-xs truncate">{book.author}</p>
                        {book.year && <p className="text-slate-400 text-[10px] mt-1">{book.year} {book.publisher && `• ${book.publisher}`}</p>}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-sm">
                      <button type="button" onClick={() => handleEditBook(book)} className="p-1.5 text-slate-500 hover:text-amber-500 rounded"><Edit3 size={14}/></button>
                      <button type="button" onClick={() => handleDeleteBook(book.id)} className="p-1.5 text-slate-500 hover:text-red-500 rounded"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
