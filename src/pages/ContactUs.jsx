import React, { useEffect } from "react";
import { HiHome, HiPhone } from "react-icons/hi2";
import { MdEmail } from "react-icons/md";

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = "marketing@pinksurfing.com";
    const subject = encodeURIComponent(e.target.subject.value);
    const body = encodeURIComponent(
      `Name: ${e.target.name.value}\nEmail: ${e.target.email.value}\nMessage: ${e.target.message.value}`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-[#F4F5F7] dark:bg-black">
      {" "}
      {/* <div className="w-full lg:mb-10">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.056226365331!2d-122.08292308468864!3d37.38605197983257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fb24ca85e6b07%3A0xd5c6a2fd5db6141b!2s840%20W%20El%20Camino%20Real%20%23180%2C%20Mountain%20View%2C%20CA%2094040%2C%20USA!5e0!3m2!1sen!2sus!4v1718616766869!5m2!1sen!2sus"
          className="w-full h-[200px] lg:h-[400px]"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div> */}
      <div className="md:px-[2%] xl:px-[8%] flex flex-col lg:items-start lg:grid grid-cols-2 md:mx-8">
        <form className="m-8 md:m-8" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <h4 className="text-[18px] md:text-[27px] 2xl:text-[32px] font-[500] text-[#FF7004] dark:text-gray-400 mb-4">
              Let's make something unique together
            </h4>
            <div className="flex-col flex mb-4">
              <label
                className="text-[#7A7A7A] dark:text-gray-500 font-[700]  text-[12px] md:text-[14px] 2xl:text-[14.4px] mb-1"
                htmlFor="name"
              >
                Your Name<span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                id="name"
                type="text"
                className="w-full border-[1.4px] border-[#999999] p-2.5 text-[#7A7A7A] dark:text-gray-500 bg-transparent text-[14.4px]"
                placeholder="Your Name"
                required
              />
            </div>
            <div className="flex-col flex mb-4">
              <label
                className="text-[#7A7A7A] dark:text-gray-500 font-[700]  text-[12px] md:text-[14px] 2xl:text-[14.4px] mb-1"
                htmlFor="email"
              >
                Your Email<span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                id="email"
                type="email"
                className="w-full border-[1.4px] border-[#999999] p-2.5 text-[#7A7A7A] dark:text-gray-500 bg-transparent text-[14.4px]"
                placeholder="Your Email"
                required
              />
            </div>
            <div className="flex-col flex mb-4">
              <label
                className="text-[#7A7A7A] dark:text-gray-500 font-[700]  text-[12px] md:text-[14px] 2xl:text-[14.4px] mb-1"
                htmlFor="subject"
              >
                Subject<span className="text-red-500">*</span>
              </label>
              <input
                name="subject"
                id="subject"
                type="text"
                className="w-full border-[1.4px] border-[#999999] p-2.5 text-[#7A7A7A] dark:text-gray-500 bg-transparent text-[14.4px]"
                placeholder="Subject"
                required
              />
            </div>
            <div className="flex-col flex mb-4">
              <label
                className="text-[#7A7A7A] dark:text-gray-500 font-[700]  text-[12px] md:text-[14px] 2xl:text-[14.4px] mb-1"
                htmlFor="message"
              >
                Your Message<span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                id="message"
                className="w-full border-[1.4px] border-[#999999] p-2.5 text-[#7A7A7A] dark:text-gray-500 bg-transparent text-[14.4px]"
                placeholder="Your Message"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#363F4D] w-fit border-[1.4px] border-[#363F4D] px-4 py-2.5 font-medium uppercase text-[13px] text-white mt-1"
            >
              Send
            </button>
          </div>
        </form>
        <div className="w-full px-[5%] lg:px-[8%] flex flex-col justify-between md:mt-10">
          <div className="flex flex-col p-5 bg-[#F2F2F2] dark:bg-white/5">
            <h4 className="text-[18px] md:text-[26px] 2xl:text-[31px] font-[700]  text-[#363F4D] dark:text-gray-400 mb-2">
              Contact Us
            </h4>
            <p className="text-[#7A7A7A] dark:text-gray-500 text-[12px] md:text-[13px] 2xl:text-[14px] font-[400]">
              We'd love to hear from you! Whether you have a question about
              features, pricing, need a demo, or anything else, our team is
              ready to answer all your questions.
            </p>
            <div className="mt-3 py-1 flex flex-col font-[600]  text-[#222222] dark:text-gray-400 text-[15px] md:text-[19px] 2xl:text-[20px]">
              <p className="flex items-center gap-2">
                <HiHome className="text-[17px]" />
                Office Address
              </p>
              <span className="text-[#666666] dark:text-gray-500 text-[12px] md:text-[13px] 2xl:text-[14px] font-[500] ">
                840 West El Camino Suite 180, Mountain View, CA 94040
              </span>
            </div>
            {/* <div className="mt-3 py-6 border-t border-b border-gray-300 flex flex-col font-[600]  text-[#222222] dark:text-gray-400 text-[15px] md:text-[19px] 2xl:text-[20px]">
              <p className="flex items-center gap-2">
                <HiPhone className="text-[15px]" /> Phone
              </p>
              <span className="text-[#666666] dark:text-gray-500 text-[12px] md:text-[13px] 2xl:text-[14px] font-[500] ">
                Toll Free: <a href="tel:600 505253">600 505253</a>
                <br />
                Mobile: <a href="tel:+971 56 673 6852">+971 56 673 6852</a>
              </span>
            </div> */}
            <div className="mt-3 py-1 flex flex-col font-[600]  text-[#222222] dark:text-gray-400 text-[15px] md:text-[19px] 2xl:text-[20px]">
              <p className="flex items-center gap-2">
                <MdEmail className="text-[17px]" /> Email
              </p>
              <span className="text-[#666666] dark:text-gray-500 text-[12px] md:text-[13px] 2xl:text-[14px] font-[500] ">
                <a href="mailto:marketing@pinksurfing.com">
                  marketing@pinksurfing.com
                </a>
              </span>
            </div>
          </div>
          {/* <div className="flex flex-col lg:flex-row lg:justify-between lg:gap-6 gap-4 md:gap-6 md:text-center px-5 py-6 md:p-0">
            <Link
              to="/about-us"
              className="w-fit mx-auto lg:mx-0 text-center px-4 py-2.5 font-medium uppercase text-[14px] md:text-[15px] text-white bg-[#FF7004] dark:bg-[#FF7004] hover:bg-opacity-90"
            >
              About Us
            </Link>
            <Link
              to="/careers"
              className="w-fit mx-auto lg:mx-0 text-center px-4 py-2.5 font-medium uppercase text-[14px] md:text-[15px] text-white bg-[#FF7004] dark:bg-[#FF7004] hover:bg-opacity-90"
            >
              Careers
            </Link>
            <Link
              to="/contact"
              className="w-fit mx-auto lg:mx-0 text-center px-4 py-2.5 font-medium uppercase text-[14px] md:text-[15px] text-white bg-[#FF7004] dark:bg-[#FF7004] hover:bg-opacity-90"
            >
              Contact Us
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Contact;
