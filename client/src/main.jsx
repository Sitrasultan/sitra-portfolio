import {createRoot} from 'react-dom/client';import {useEffect,useState} from 'react';import './styles.css';import App from './App.jsx';import Admin from './Admin.jsx';
const Root=()=>{const [h,setH]=useState(location.hash);useEffect(()=>{const f=()=>setH(location.hash);addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return h==='#/admin'?<Admin/>:<App/>};
createRoot(document.getElementById('root')).render(<Root/>);
