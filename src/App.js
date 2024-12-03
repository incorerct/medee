import React, { useState } from "react";
import Login from "./components/login";
import Room from "./components/Room";
import "./App.css";

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const getTodayDate = () => formatDate(new Date());

  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [filterKey, setFilterKey] = useState(0); 

  const setToday = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
    applyFilter();
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = formatDate(yesterday);
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    applyFilter();
  };

  const setLastWeek = () => {
    const today = new Date();
    const lastWeekStart = new Date();
    lastWeekStart.setDate(today.getDate() - 7);
    setStartDate(formatDate(lastWeekStart));
    setEndDate(getTodayDate());
    applyFilter();
  };

  const applyFilter = () => {
    setFilterKey((prevKey) => prevKey + 1); 
    console.log(`${startDate} ээс ${endDate} хооронд амжилттай филтерлэлээ`);
  };

  const logout = () => {
    setUserRole(null);
    setUserName(null);
  };

  if (!userRole || !userName) {
    return <Login setUserRole={setUserRole} setUserName={setUserName} />;
  }

  return (
    <div className="app">
      <h1>Тавтай морил, {userName}!</h1>

      <button className="logout-button" onClick={logout}>Гарах</button>

      <div className="date-filter">
        <label>Эхлэх огноо:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>Дуусах огноо:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="apply-filter" onClick={applyFilter}>Филтэрлэх</button>

        <div className="quick-filters">
          <button onClick={setToday}>Өнөөдөр</button>
          <button onClick={setYesterday}>Өчигдөр</button>
          <button onClick={setLastWeek}>Өнгөрсөн 7 хоног</button>
        </div>
      </div>

      <div className="rooms">
        <Room
          key={`room-ami-${filterKey}`} 
          roomName="Ами Тасаг"
          startDate={startDate}
          endDate={endDate}
          userRole={userRole}
        />
        <Room
          key={`room-tami-${filterKey}`}
          roomName="Тами Тасаг"
          startDate={startDate}
          endDate={endDate}
          userRole={userRole}
        />
        <Room
          key={`room-pororo1-${filterKey}`} 
          roomName="Пороро 1 Тасаг"
          startDate={startDate}
          endDate={endDate}
          userRole={userRole}
        />
        <Room
          key={`room-pororo2-${filterKey}`} 
          roomName="Пороро 2 Тасаг"
          startDate={startDate}
          endDate={endDate}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

export default App;
