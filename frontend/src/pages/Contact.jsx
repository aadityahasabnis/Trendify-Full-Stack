import React, { useState } from 'react';
import Title from '../components/Title';
import NewsletterBox from '../components/NewsletterBox';
import { assets } from '../assets/frontend_assets/assets';
import useScrollToTop from '../hooks/useScrollToTop';

const Contact = () => {
  useScrollToTop();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', null


  // const onSubmitHandler = async (event) => {
  //   event.preventDefault();
  // }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null); // Reset status

    // Simulate an API call or form submission (replace with your actual logic)
    try {
      // Simulate a delay (replace with your actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Example: If the email is empty, simulate an error
      if (!email) {
        throw new Error("Email is required.");
      }

      // Simulate success
      setSubmissionStatus('success');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-10">
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1="CONTACT" text2="US" />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16 mb-20">
        <img
          className="w-full md:max-w-[450px] rounded-lg shadow-md object-cover"
          src={assets.contact_img || assets.about_img} // Use contact_img if available, fallback to about_img
          alt="Contact Trendify"
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p className="leading-relaxed">
            We're here to help! Whether you have questions about our products, need assistance with your order, or just want to say hello, we'd love to hear from you.
          </p>
          <p className="leading-relaxed">
            Please feel free to reach out to us using the contact information below, or fill out the form to send us a message directly.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Email:</h3>
              <p>support@trendify.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Phone:</h3>
              <p>+1 (555) 123-4567</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Address:</h3>
              <p>123 Trendify Street, City, State, ZIP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="my-15 mt-20 border-y py-15 border-gray-300">
        <NewsletterBox />
      </div>

      {/* Contact Form */}
      <div className="text-2xl text-center pt-">
        <Title text1="SEND" text2="US A MESSAGE" />
      </div>
      <div className="mt-8">
        <form onSubmit={onSubmitHandler} className="max-w-lg mx-auto space-y-2">
          <input
            required
            type="email"
            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${submissionStatus === 'error' && 'border-red-500'}`}
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            required
            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${submissionStatus === 'error' && 'border-red-500'}`}
            rows="3"
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <button
            type="submit"
            className={`bg-black text-white px-4 py-2 rounded-md w-full hover:bg-gray-800 transition-colors duration-200 ${isSubmitting && 'opacity-70 cursor-wait'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        {submissionStatus === 'success' && <p className="mt-2 text-green-500 text-center">Message sent successfully!</p>}
        {submissionStatus === 'error' && <p className="mt-2 text-red-500 text-center">Failed to send message. Please try again.</p>}
      </div>

    </div>
  );
};

export default Contact;