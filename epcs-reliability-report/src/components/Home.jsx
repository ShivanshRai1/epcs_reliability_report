import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className="home-bg">
      <div className="home-content">
        <h1 className="epc-title">EPC SPACE</h1>
        <h2>Rad-Hard GaN Solutions<br />for Space Applications</h2>
        <h3>Reliability Report<br />September 2024</h3>
        {/* You can add a relevant image or leave this space empty for now */}
        <button className="next-btn" onClick={() => navigate('/page/1')}>Next &gt;&gt;</button>
      </div>
    </div>
  );
};

export default Home;
