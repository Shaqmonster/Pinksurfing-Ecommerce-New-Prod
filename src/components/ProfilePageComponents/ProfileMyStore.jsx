import React from 'react'

export default function ProfileMyStore() {
  return (
    <>
    
    <div className='text-center text-white px-24 border border-gray-500  rounded-lg p-4'>
      <div className="block pt-8 space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to Your Seller Dashboard
        </h2>
        <p className="text-gray-300 text-lg">
          🚀 Ready to turn your passion into profit?
        </p>
        <p className="text-gray-400">
          Whether you're just starting out or already running a successful store, 
          Pinksurfing gives you all the tools you need to reach millions of customers worldwide.
        </p>
        <ul className="text-gray-400 text-sm space-y-2 text-left inline-block">
          <li>✨ Easy product listing & inventory management</li>
          <li>📊 Real-time sales analytics & insights</li>
          <li>💳 Secure payments & fast payouts</li>
          <li>🌍 Access to a global customer base</li>
        </ul>
      </div>

      <div className="pt-6 space-y-3">
        <p className="text-gray-300 font-medium">New here? Create your store in minutes!</p>
        <a 
          href="https://vendors.pinksurfing.com" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          Get Started as a Vendor
        </a>
        <p className="text-gray-500 text-sm pt-2">
          Already a vendor? <a href="https://vendors.pinksurfing.com" className="text-blue-400 hover:text-blue-300 underline">Login to your dashboard</a>
        </p>
      </div>
    </div>
    </>
  )
}
