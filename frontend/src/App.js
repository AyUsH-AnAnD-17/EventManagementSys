import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import EventManagement from './components/EventManagement';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <EventManagement />
    </Provider>
  );
}

export default App;