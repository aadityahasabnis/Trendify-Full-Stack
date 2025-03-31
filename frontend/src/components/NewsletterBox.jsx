import React from "react";

const NewsletterBox = () => {
    const onSubmitHandler = (event)=> {
        event.preventDefault();
    }
  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800">
        Subscribe Now & get 20% Off!
      </p>
      <p className="mt-3 text-gray-400">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi, vitae
        eius. Impedit facere unde error laboriosam laudantium dolore consectetur
        illum, cupiditate consequatur commodi, eligendi tenetur debitis voluptas
        perspiciatis ullam enim!
      </p>
      
      <form onSubmit={onSubmitHandler} className="flex items-center w-full gap-3 pl-3 mx-auto my-5 border sm:w-1/2" action="">
        <input className="w-full outline-none sm:flex-1" type="email" name="email" id="" placeholder="Enter your email" required/>
        <button type="submit" className="px-10 py-4 text-xs text-white bg-black">SUBSCRIBE</button>
      </form>
    </div>
  );
};

export default NewsletterBox;
