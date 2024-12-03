import React, { useState, useEffect } from "react";
import "./Room.css";
import { db } from "../firebase";
import { collection, addDoc, doc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { auth } from "../firebase";
import * as XLSX from "xlsx";

const Room = ({ roomName, startDate, endDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [inputData, setInputData] = useState({});
  const [savedData, setSavedData] = useState({});
  const [viewOption, setViewOption] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCategory, setViewCategory] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [importantNotes, setImportantNotes] = useState([]);
  const [newImportantNote, setNewImportantNote] = useState("");
  const [importantDates, setImportantDates] = useState([]);


  const categories = [
    { name: "Тарилга", options: ["Cудас", "Дусал", "Булчин", "Арьсан дор", "Арьсан дотор"] },
    { name: "Гардан ажилбар", options: ["Амин үзүүлэлт", "Антибиотик/тариагаар/", "Антибиотик/уухаар/", "Уян зүү", "Яаралтай тусламж (O2)", "Нүдэнд эм дусаах", "Нүдэнд тос хавчуулах", "Хамар цэвэрлэх, угаах", "Хамарт эм дусаах", "Чих цэвэрлэх, угаах", "Чихэнд эм дусаах", "Утлага хийх", "Клизм тавих", "Шулуун гэдсэнд лаа хийх", "Биеийн жин үзэж тэмдэглэх", "Шарх цэвэрлэх", "Боолт хийх", "Гардан хооллосон хүүхэд", "Эм гардан уулгасан", "Толгойд тос түрхэх"] },
    { name: "АШББ хөтлөх", options: ["Эмийн түүвэр хийх", "Стори бодох", "Сувилгааны түүх бодох"] },
    { name: "Шинжилгээ", options: ["Биохими", "Цусны ерөнхий", "ЦЕШ", "ШЕШ", "Цагаан хорхой", "Рентген", "ЭХО", "Нарийн мэргэжлийн эмчийн үзлэг"] },
    { name: "Асаргаа, сувилагаа", options: ["Усанд оруулах", "Ор засаж, цэвэрлэх", "Цагаан хэрэглэл солих", "Хэсэгчилсэн угаалга хийх (гар, хөл, шүд, ам)"] },
    { name: "ДХ", options: ["Хөдөлгөөн засал", "Хөдөлмөр засал", "Хэл засал"] },
    { name: "Бусад ажил", options: ["Эмийн сангаас эм авах", "Эмчилгээ тараах", "Эмчлүүлэгч нарт зөвлөгөө өгөх, хяналт тавих", "Агаарт гаргасан", "Ариутгал цэвэрлэгээ хийсэн", "ЭМБО олгосон үйлчлүүлэгчийн тоо", "Дотоод журам танилцуулах", "Халдвартай хог хаягдал", "Аюулгүй хайрцаг", "Квартз"] },
  ];

  const categoryMapping = {
    "Тарилга": "Тарилга",
    "Гардан ажилбар": "Aмин үзүүлэлт",
    "АШББ хөтлөх": "Гардан ажилбар",
    "Шинжилгээ": "Шинжилгээ",
    "Асаргаа, сувилагаа": "Асаргаа, Сувилгаа",
    "ДХ": "Д/Х",
    "Бусад ажил": "Биеийн жин",
  };
  

  const fetchUserRoleAndName = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserName(userData.displayName);
        } else {
          console.error("User document does not exist.");
        }
      }
    } catch (error) {
      console.error("Error fetching user role and name: ", error);
    }
  };

  useEffect(() => {
    fetchUserRoleAndName();
  }, []);

  const fetchSavedData = async () => {
    try {
      const roomRef = doc(db, "rooms", roomName);
      const collections = [
        "тарилга",
        "гардан ажилбар",
        "ашбб хөтлөх",
        "шинжилгээ",
        "асаргаа, сувилагаа",
        "дх",
        "бусад ажил",
      ];

      let aggregatedData = {};

      for (const category of collections) {
        const categoryRef = collection(roomRef, category);
        const querySnapshot = await getDocs(categoryRef);

        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          const docDate = docData.date;
          const addedBy = docData.addedBy;

          if (docDate >= startDate && docDate <= endDate) {
            if (!aggregatedData[category]) {
              aggregatedData[category] = {};
            }

            const categoryData = docData.data || {};
            for (const option in categoryData) {
              if (!aggregatedData[category][option]) {
                aggregatedData[category][option] = [];
              }

              aggregatedData[category][option].push({
                date: docDate,
                value: categoryData[option],
                addedBy,
              });
            }
          }
        });
      }

      setSavedData(aggregatedData);
    } catch (error) {
      console.error("Өгөгдлийг татахад алдаа гарлаа: ", error);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchSavedData();
    }
  }, [startDate, endDate, roomName]);



  
  const handleExportToExcel = async () => {
    if (isLoadingData) {
      console.log("Data is still loading. Please wait...");
      return;
    }
  
    setIsLoadingData(true);
  
    try {
      await fetchSavedData(); 
  
      // Check if data length is greater than zero before proceeding with export
      if (!savedData || Object.keys(savedData).length === 0) {
        console.log("No data available to export.");
        alert("Мэдээлэл авахад алдаа гарлаа, түр хүлээгээд ахин оролдоно уу.");
        return; // Don't proceed if no data is available
      }
  
      // Proceed with generating the Excel file
      const workbook = XLSX.utils.book_new();
      const worksheetData = [];
  
      // Calculate the number of days between startDate and endDate
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInTime = end.getTime() - start.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24)) + 1; // Convert milliseconds to days and add 1
  
      const dateRange = Array.from({ length: diffInDays }, (_, i) => {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i); // Increment by one day
        return nextDate.toISOString().split("T")[0];
      });
  
      worksheetData.push(["Ангилал", "Сонголт", ...dateRange, "Нийт"]); // Add "Total" as the last column
  
      // Fill in Data for all categories and options
      categories.forEach((category) => {
        const options = category.options;
  
        options.forEach((option) => {
          const row = [
            category.name, // Category Name
            option, // Option Name
            ...dateRange.map((date) => {
              const matchingData = savedData[category.name.toLowerCase()]?.[option]?.find(
                (entry) => entry.date === date
              );
              return matchingData ? matchingData.value : ""; // Empty string for no data
            }),
          ];
  
          // Calculate the total for the row
          const total = row.slice(2).reduce((sum, value) => sum + (parseInt(value, 10) || 0), 0);
          row.push(total); // Add the total value to the row
  
          worksheetData.push(row);
        });
      });
  
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
      // Merge Cells for Category Column
      let currentRow = 1;
      categories.forEach((category) => {
        const options = category.options;
        const rowSpan = options.length;
  
        worksheet["!merges"] = worksheet["!merges"] || [];
        worksheet["!merges"].push({
          s: { r: currentRow, c: 0 },
          e: { r: currentRow + rowSpan - 1, c: 0 },
        });
  
        currentRow += rowSpan;
      });
  
      XLSX.utils.book_append_sheet(workbook, worksheet, `${roomName} Data`);
      XLSX.writeFile(workbook, `${roomName}-Data.xlsx`);
    } catch (error) {
      console.error("Error occurred while exporting data:", error);
      alert("Мэдээ татах болон экспорт хийхэд алдаа гарлаа.");
    } finally {
      setIsLoadingData(false); // Reset loading state after export attempt
    }
  };
  
  
  
  

  const handleCategoryClick = async (category) => {
    if (userRole === "add") {
      alert("Танд мэдээ нэмэх эрх байхгүй байна.");
      return;
    }
    setSelectedCategory(category);
  
    // Fetch existing data for the category and date (startDate)
    try {
      const roomRef = doc(db, "rooms", roomName);
      const categoryRef = collection(roomRef, category.name.toLowerCase());
  
      // Use the selected startDate for filtering
      const querySnapshot = await getDocs(categoryRef);
      const existingData = {};
  
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData.date === startDate) {
          Object.assign(existingData, docData.data);
        }
      });
  
      setInputData(existingData); // Prepopulate input fields with fetched data
    } catch (error) {
      console.error("Одоо байгаа мэдээг татахад алдаа гарлаа:", error);
    }
  };
  const handleInputChange = (e, option) => {
    // Ensure only integers are allowed
    const value = e.target.value;
  
    // Check if the value is a valid integer
    if (value === '' || /^\d+$/.test(value)) {
      setInputData({ ...inputData, [option]: value });
    }
  };

const handleSubmit = async () => {
  if (isSubmitting) return;

  try {
    if (!selectedCategory) {
      alert("Ангилал сонгоно уу!");
      return;
    }

    if (Object.keys(inputData).length === 0) {
      alert("Дор хаяж нэг талбарыг бөглөнө үү!");
      return;
    }

    setIsSubmitting(true);

    const roomRef = doc(db, "rooms", roomName);
    const categoryRef = collection(roomRef, selectedCategory.name.toLowerCase());

    // Convert inputData values to integers
    const inputDataAsIntegers = Object.keys(inputData).reduce((acc, option) => {
      const value = parseInt(inputData[option], 10);
      acc[option] = isNaN(value) ? 0 : value;  // Default to 0 if not a valid number
      return acc;
    }, {});

    // Use the startDate for saving
    const user = auth.currentUser;

    if (!userName) {
      alert("Хэрэглэгчийн нэр байхгүй байна!");
      setIsSubmitting(false);
      return;
    }

    let existingDocId = null;
    const querySnapshot = await getDocs(categoryRef);

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      if (docData.date === startDate) {
        existingDocId = doc.id;
      }
    });

    if (existingDocId) {
      const docRef = doc(categoryRef, existingDocId);
      await updateDoc(docRef, {
        data: inputDataAsIntegers,
        addedBy: userName,
      });
      alert("Мэдээг амжилттай шинэчилсэн!");
    } else {
      await addDoc(categoryRef, {
        category: selectedCategory.name,
        data: inputDataAsIntegers,
        date: startDate, // Save with startDate
        addedBy: userName,
      });
      alert("Мэдээг амжилттай хадгаллаа!");
    }

    setInputData({});
    setSelectedCategory(null);
    fetchSavedData(); // Refresh the saved data
  } catch (error) {
    console.error("Мэдээг хадгалахад алдаа гарлаа: ", error);
    alert("Мэдээг хадгалахад алдаа гарлаа");
  } finally {
    setIsSubmitting(false);
  }
};
  
  const handleViewCategoryClick = async (category) => {
    setViewCategory(category);
    try {
      const roomRef = doc(db, "rooms", roomName);
      const categoryRef = collection(roomRef, `${category.name.toLowerCase()}_comments`);
  
      // Construct the query to filter comments based on the date range
      const querySnapshot = await getDocs(categoryRef);
      const fetchedComments = [];
  
      querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        const commentTimestamp = new Date(commentData.timestamp);
        const commentDate = commentTimestamp.toISOString().split("T")[0]; // Get the date part
  
        // Check if the comment date is within the selected date range
        if (commentDate >= startDate && commentDate <= endDate) {
          fetchedComments.push({ id: doc.id, ...commentData });
        }
      });
  
      // Sort comments by timestamp
      fetchedComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
      setComments(fetchedComments);
    } catch (error) {
      console.error("Алдаа: Сэтгэгдлийг татаж чадсангүй", error);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
  
    try {
      const roomRef = doc(db, "rooms", roomName);
      const categoryRef = collection(roomRef, `${viewCategory.name.toLowerCase()}_comments`);
  
      await addDoc(categoryRef, {
        text: newComment,
        timestamp: new Date().toISOString(),
        addedBy: userName || "Unknown",
      });
  
      setNewComment("");
      handleViewCategoryClick(viewCategory); // Refresh comments
    } catch (error) {
      console.error("Сэтгэгдэл нэмэхэд алдаа гарлаа: ", error);
    }
  };

const fetchImportantNotes = async () => {
  try {
    const roomRef = doc(db, "rooms", roomName);
    const notesRef = collection(roomRef, "important_notes");

    // Fetch all notes
    const querySnapshot = await getDocs(notesRef);
    const fetchedNotes = [];

    querySnapshot.forEach((doc) => {
      const noteData = doc.data();
      const noteTimestamp = new Date(noteData.timestamp);
      const noteDate = noteTimestamp.toISOString().split("T")[0]; // Extract date part

      // Filter based on the selected date range
      if (noteDate >= startDate && noteDate <= endDate) {
        fetchedNotes.push({ id: doc.id, ...noteData });
      }
    });

    // Sort the filtered notes by timestamp
    fetchedNotes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    setImportantNotes(fetchedNotes);
  } catch (error) {
    console.error("Error fetching important notes:", error);
  }
};


  const handleAddImportantNote = async () => {
    if (!newImportantNote.trim()) return;
    try {
      const roomRef = doc(db, "rooms", roomName);
      const notesRef = collection(roomRef, "important_notes");

      await addDoc(notesRef, {
        text: newImportantNote,
        timestamp: new Date().toISOString(),
        addedBy: userName || "Unknown",
      });

      setNewImportantNote("");
      fetchImportantNotes(); // Refresh the notes
    } catch (error) {
      console.error("Error adding important note:", error);
    }
  };


  useEffect(() => {
    if (isOpen) {
      fetchImportantNotes();
    }
  }, [isOpen]);




  return (
    <div className="room">
      <h3>{roomName}</h3>

      <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? "Хаах" : "Нээх"} 
      </button>

      {(isLoadingData || isSubmitting) && (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        )}

      {isOpen && (
        <div className="popup">
          {userRole !== "preview" && (
  <button
    onClick={() => setViewOption("important")}
    style={{
      backgroundColor: '#cd5f08',
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '5px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer'
    }}
  >
    Анхаарал Татсан
  </button>
)}


          
          {userRole !== "preview" && (
            <button onClick={() => setViewOption("add")}>Сувилагчийн Тэмдэглэл</button>
          )}
          <button onClick={() => setViewOption("preview")}>Тоон Мэдээ</button>
          <button onClick={handleExportToExcel}>Тоон Мэдээ Татах</button>

          {viewOption === "add" && (
          <div className="view-popup">
            {!viewCategory && (
              <div>
                <h4>Ангилалаа сонгоно уу!</h4>
                {categories.map((category, idx) => (
                  <button key={idx} onClick={() => handleViewCategoryClick(category)}>
                  {["Тарилга", "Амин үзүүлэлт", "Гардан ажилбар", "Шинжилгээ", "Асаргаа, сувилгаа", "Д/Х", "Биеийн жин"][idx]}
                </button>
                
                ))}
              </div>
    )}


{viewCategory && (
  <div className="comments-container">
    <h4 className="category-title">
  {categoryMapping[viewCategory.name]} - Тэмдэглэгээ
</h4>
    
    {/* Comments Section */}
    <div className="comments">
      {comments.length > 0 ? (
        comments.map((comment, idx) => (
          <div key={idx} className="comment-item">
            <strong className="comment-author">{comment.addedBy}</strong>
            <p className="comment-text">{comment.text}</p>
            <span className="comment-time">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
          </div>
        ))
      ) : (
        <p className="no-comments">Одоогоор сэтгэгдэл алга байна.</p>
      )}
    </div>

    {/* New Comment Form */}
    <div className="new-comment-form">
      <textarea
        className="comment-input"
        placeholder="Сэтгэгдэл бичих..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      ></textarea>
      <button
          className="back-button"
          onClick={() => setViewCategory(null)}
        >
          Буцах
        </button>
      <div className="buttons">
        <button className="add-comment-button" onClick={handleAddComment}>
          Сэтгэгдэл нэмэх
        </button>
      </div>
    </div>
  </div>
)}

  </div>
)}


{viewOption === "important"&&userRole !== "preview"&& (
  <div className="important-notes">
    <h4 className="important-title">Анхаарах ёстой зүйлс</h4>
    
    {/* Date Filter Already Applied */}
    <div className="notes-list">
      {importantNotes.length > 0 ? (
        importantNotes.map((note, idx) => (
          <div key={idx} className="note-item">
            <strong className="note-author">{note.addedBy}</strong>
            <p className="note-text">{note.text}</p>
            <span className="note-time">
              {new Date(note.timestamp).toLocaleString()}
            </span>
          </div>
        ))
      ) : (
        <p className="no-notes">Одоогоор анхаарах зүйлс алга байна.</p>
      )}
    </div>

    {/* New Note Input */}
    <div className="new-note-form">
      <textarea
        className="note-input"
        placeholder="Анхаарах зүйл бичих..."
        value={newImportantNote}
        onChange={(e) => setNewImportantNote(e.target.value)}
      ></textarea>
      <div className="buttons">
        <button className="add-note-button" onClick={handleAddImportantNote}>
          Нэмэх
        </button>
      </div>
    </div>
  </div>
)}






{viewOption === "preview" && userRole !== "add" && (
  <div className="view-popup">
    {!selectedCategory && (
      <div>
        <h4>Ангилалаа сонгоно уу!</h4>
        {categories.map((category, idx) => (
          <button key={idx} onClick={() => handleCategoryClick(category)}>
            {category.name}
          </button>
        ))}
      </div>
    )}

    {selectedCategory && (
      <div className="category-preview">
        <h4>{selectedCategory.name}</h4>
        
        {/* Display Options */}
        {selectedCategory.options.map((option, idx) => (
          <div key={idx}>
            <label>{option}:</label>
            <input
              type="text"
              value={inputData[option] || ""}
              onChange={(e) => handleInputChange(e, option)}
              disabled={userRole === "preview"} 
            />
          </div>
        ))}

        <div className="new-comment-form">
          <button
            className="back-button"
            onClick={() => setSelectedCategory(null)}
          >
            Буцах
          </button>

          {(userRole === "admin" || userRole === "add") && (
            <button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Илгээж байна..." : "Хадгалах"}
            </button>
          )}
        </div>
      </div>
    )}
  </div>
)}









        </div>
      )}
    </div>
  );
};

export default Room;
