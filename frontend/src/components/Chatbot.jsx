import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { ShopContext } from '../context/ShopContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Chatbot = () => {
    const { backendUrl, token, setToken } = useContext(ShopContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const messagesEndRef = useRef(null);
    const chatRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Get current page and product ID
    const currentPage = location.pathname;
    const currentProductId = currentPage.startsWith('/product/') ? currentPage.split('/')[2] : null;

    // Scroll to bottom function
    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 0);
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch user data when token changes
    useEffect(() => {
        const fetchUserData = async () => {
            console.log('Token status:', token ? 'Token exists' : 'No token');
            if (token) {
                try {
                    console.log('Fetching user data from:', `${backendUrl}/api/user/profile`);
                    const response = await axios.get(`${backendUrl}/api/user/profile`, {
                        headers: { token }
                    });
                    console.log('User data response:', response.data);
                    if (response.data.success) {
                        setUserData(response.data.user);
                        console.log('User data set:', response.data.user);
                    } else {
                        console.log('Failed to get user data:', response.data.message);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    if (error.response?.status === 401) {
                        setToken(null);
                        localStorage.removeItem('token');
                        toast.error('Session expired. Please login again.');
                        navigate('/login');
                    }
                }
            }
        };

        fetchUserData();
    }, [token, backendUrl, setToken, navigate]);

    // Fetch conversation history when opening the chat
    useEffect(() => {
        const fetchHistory = async () => {
            if (isOpen && token) {
                try {
                    const response = await fetch(`${backendUrl}/api/chatbot/history`, {
                        headers: {
                            'token': token
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    if (data.success && data.messages?.length > 0) {
                        setMessages(data.messages);
                        // Ensure we scroll after messages are set
                        scrollToBottom();
                    }
                } catch (error) {
                    console.error('Error fetching conversation history:', error);
                }
            }
        };

        fetchHistory();
    }, [isOpen, token, backendUrl]);

    // Initial welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = userData
                ? `Welcome to Trendify, ${userData.name}! I'm your shopping assistant. How can I help you today?`
                : "Welcome to Trendify! I'm your shopping assistant. How can I help you today?";

            setMessages([{
                role: 'assistant',
                content: welcomeMessage
            }]);
        }
    }, [isOpen, userData, messages.length]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const response = await fetch(`${backendUrl}/api/chatbot/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token || ''
                },
                body: JSON.stringify({
                    message: userMessage,
                    userId: token ? jwtDecode(token).id : null,
                    currentPage,
                    currentProductId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.'
                }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen ? (
                <div ref={chatRef} className="bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <FaRobot className="text-xl" />
                            <span className="font-semibold">Trendify Assistant</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:text-gray-200 transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    <div className="whitespace-pre-line">
                                        {message.content ? (
                                            message.content.split('**').map((part, i) => {
                                                if (i % 2 === 1) {
                                                    return <span key={i} className="font-bold">{part}</span>;
                                                }
                                                return part;
                                            })
                                        ) : (
                                            <span className="text-gray-500">No message content</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t p-4 bg-white">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={token ? "Type your message..." : "Sign in to chat"}
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isLoading || !token}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !token}
                                className={`p-2 rounded-lg ${isLoading || !token
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                    } text-white transition-colors`}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => {
                        if (!token) {
                            toast.info('Please sign in to use the chatbot');
                            navigate('/login');
                            return;
                        }
                        setIsOpen(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                    <FaRobot size={24} />
                </button>
            )}
        </div>
    );
};

export default Chatbot; 