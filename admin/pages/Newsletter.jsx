import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Newsletter = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('token');
    const [subscribers, setSubscribers] = useState([]);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Quill modules configuration
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false
        }
    }), []);

    // Quill formats configuration
    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet',
        'align',
        'link', 'image'
    ];

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/newsletter/subscribers`,
                { headers: { token } }
            );
            if (response.data.success) {
                setSubscribers(response.data.subscribers);
            }
        } catch (error) {
            toast.error('Error fetching subscribers');
            console.log(error);
        }
    };

    const handleSendNewsletter = async () => {
        if (!subject || !content) {
            toast.error('Please fill in both subject and content');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(
                `${backendUrl}/api/newsletter/send`,
                { subject, content },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                setSubject('');
                setContent('');
                setShowPreview(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error sending newsletter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Newsletter Dashboard</h2>
                <div className="bg-white p-4 rounded-lg shadow">
                    {/* <h2 className="text- font-medium mb-2">Subscriber Statistics</h2> */}
                    <p className="text-gray-600">
                        <span className="font-medium">Total Subscribers: </span>  {subscribers.filter(s => s.isSubscribed).length}
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Send Newsletter</h3>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:border-gray-500"
                        placeholder="Enter newsletter subject"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Content
                    </label>
                    <div className="">
                        <ReactQuill
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            formats={formats}
                            theme="snow"
                            className="h-64 mb-12 "
                            preserveWhitespace={true}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        Preview
                    </button>
                    <button
                        onClick={handleSendNewsletter}
                        disabled={loading}
                        className={`px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Sending...' : 'Send Newsletter'}
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <>
                    {/* Backdrop with blur */}
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowPreview(false)}
                    >
                        {/* Modal */}
                        <div
                            className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <h3 className="text-xl font-semibold">Newsletter Preview</h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <span className="text-3xl">×</span>
                                </button>
                            </div>

                            {/* Subject */}
                            <div className="mb-4 pb-4 border-b">
                                <p className="text-gray-600 text-sm uppercase tracking-wide mb-1">Subject</p>
                                <p className="text-lg font-medium">{subject}</p>
                            </div>

                            {/* Content */}
                            <div className="prose max-w-none">
                                <div
                                    className="py-4"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t text-right">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Subscribers List */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Subscribers List</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subscription Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subscribers.map((subscriber) => (
                                <tr key={subscriber._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {subscriber.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(subscriber.subscriptionDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subscriber.isSubscribed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {subscriber.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Newsletter; 