import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  return (
    <>
      {!isLogin && <Header />}
      <main>{children}</main>
      {!isLogin && <Footer />}
    </>
  );
};

export default Layout;
