import React, { useState, useEffect } from "react";
import api from "../api/api";
import { motion } from "framer-motion";
import {
  Check,
  Users,
  Maximize,
  ArrowRight,
  ChevronRight,
  Wifi,
  Coffee,
  Phone,
  Shield,
  Calendar,
  Sparkles,
  Armchair,
  Star,
  Car,
  Droplets,
  Wind,
  Tv,
  ArrowLeft,
  X,
  Search,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AttractionsList from "./AttractionList";
import { rooms } from "../data/rooms";
import ResponsiveImage from "../components/ResponsiveImage";

// Shared rooms data
const roomsData = [
  {
    id: "standard-double",
    name: "Standard Double Bedroom Non AC",
    shortName: "Standard Double",
    price: "₹2,500",
    priceBreakfast: "₹3,000",
    size: "250 sq ft",
    occupancy: "2 Adults",
    category: "standard",
    popular: false,
    badge: "Budget Friendly",
    rating: 4.2,
    reviews: 128,
    description:
      "Experience affordable luxury in our Standard Double Bedroom (Non-AC) at Hotel Shiv Ganga. Designed to offer premium comfort at a reasonable price, this room ensures a refined stay without compromising on elegance.",
    fullDescription:
      "Featuring a cozy double bed, stylish interiors, a serene ambiance, flat-screen LED TV, and a modern bathroom perfect for guests who seek luxury that feels effortless.",
    image: "/images/room-img1.webp",
    images: [
      "/images/room-img1.webp",
      "/images/room-img2.webp",
      "/images/room-img3.webp",
    ],
    amenities: [
      "Comfortable Double Bed",
      "LED Flat-screen TV",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Armchair, label: "Comfortable Bed" },
      { icon: Tv, label: "LED TV" },
      { icon: Droplets, label: "Hot Water" },
    ],
  },
  {
    id: "deluxe-double",
    name: "Deluxe Double Bedroom AC",
    shortName: "Deluxe Double",
    price: "₹3,500",
    priceBreakfast: "₹4,000",
    size: "300 sq ft",
    occupancy: "2 Adults",
    category: "deluxe",
    popular: true,
    badge: "Most Popular",
    rating: 4.7,
    reviews: 245,
    description:
      "Designed for guests who prefer a more spacious, refined, relaxing experience. With elegant interiors and individual air conditioning, this room offers a noticeable upgrade in comfort and ambiance.",
    fullDescription:
      "With a plush double bed, control your comfort with personalized AC. Ideal for business travelers and families, this room delivers a premium stay with enhanced comfort and privacy.",
    image: "/images/room-img2.webp",
    images: [
      "/images/room-img2.webp",
      "/images/room-img3.webp",
      "/images/room-img1.webp",
    ],
    amenities: [
      "Plush Double Bed",
      "LED Flat-screen TV",
      "Air Conditioning",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Armchair, label: "Plush Bed" },
      { icon: Wind, label: "Air Conditioning" },
      { icon: Tv, label: "LED TV" },
    ],
  },
  {
    id: "triple-room",
    name: "Triple Bedroom AC",
    shortName: "Triple Room",
    price: "₹4,000",
    priceBreakfast: "₹4,750",
    size: "400 sq ft",
    occupancy: "3 Adults",
    category: "triple",
    popular: false,
    badge: "Great for Groups",
    rating: 4.5,
    reviews: 167,
    description:
      "Specially designed for families, friends and small groups who need extra space without compromising on budget and comfort. Providing planned interiors and modern amenities, this room ensures space and comfort for everyone.",
    fullDescription:
      "Multiple comfortable beds, stay refreshed with individual air conditioning, and an LED TV for entertainment, along with a sitting area for family time.",
    image: "/images/room-img4.webp",
    images: [
      "/images/room-img4.webp",
      "/images/room-img2.webp",
      "/images/room-img3.webp",
    ],
    amenities: [
      "Multiple Comfortable Beds",
      "Air Conditioning",
      "LED Flat-screen TV",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Users, label: "3 Guests" },
      { icon: Wind, label: "Air Conditioning" },
      { icon: Tv, label: "LED TV" },
    ],
  },
  {
    id: "himalayan-balcony",
    name: "Himalayan Balcony",
    shortName: "Himalayan Balcony",
    price: "₹4,500",
    priceBreakfast: "₹5,500",
    size: "500 sq ft",
    occupancy: "4 Adults",
    category: "family",
    popular: false,
    badge: "Family Suite",
    rating: 4.8,
    reviews: 203,
    description:
      "Perfectly tailored for families and larger groups who want space without compromising on comfort and style. Relax on comfortable beds for four, enjoy personalized air conditioning, and unwind with entertainment on a flat screen LED TV.",
    fullDescription:
      "With a well-appointed private bathroom and a cozy sitting area, this room is perfect for family vacations, group travel, or extended stays, providing comfort, privacy and style in one delightful space.",
    image: "/images/room-img5.webp",
    images: [
      "/images/room-img3.webp",
      "/images/room-img2.webp",
      "/images/room-img4.webp",
    ],
    amenities: [
      "Comfortable Beds for Four",
      "Air Conditioning",
      "LED Flat-screen TV",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Users, label: "4 Guests" },
      { icon: Wind, label: "Air Conditioning" },
      { icon: Tv, label: "LED TV" },
    ],
  },
  {
    id: "grand-family-suite",
    name: "Grand Family Suite",
    shortName: "Grand Family Suite",
    price: "₹4,000",
    priceBreakfast: "₹4,750",
    size: "400 sq ft",
    occupancy: "3 Adults",
    category: "triple",
    popular: false,
    badge: "Great for Groups",
    rating: 4.5,
    reviews: 167,
    description:
      "Specially designed for families, friends and small groups who need extra space without compromising on budget and comfort. Providing planned interiors and modern amenities, this room ensures space and comfort for everyone.",
    fullDescription:
      "Multiple comfortable beds, stay refreshed with individual air conditioning, and an LED TV for entertainment, along with a sitting area for family time.",
    image: "/images/room-img6.webp",
    images: [
      "/images/room-img4.webp",
      "/images/room-img2.webp",
      "/images/room-img3.webp",
    ],
    amenities: [
      "Multiple Comfortable Beds",
      "Air Conditioning",
      "LED Flat-screen TV",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Users, label: "3 Guests" },
      { icon: Wind, label: "Air Conditioning" },
      { icon: Tv, label: "LED TV" },
    ],
  },
  {
    id: "family-four",
    name: "Family Four Bedroom AC",
    shortName: "Family Four",
    price: "₹4,500",
    priceBreakfast: "₹5,500",
    size: "500 sq ft",
    occupancy: "4 Adults",
    category: "family",
    popular: false,
    badge: "Family Suite",
    rating: 4.8,
    reviews: 203,
    description:
      "Perfectly tailored for families and larger groups who want space without compromising on comfort and style. Relax on comfortable beds for four, enjoy personalized air conditioning, and unwind with entertainment on a flat screen LED TV.",
    fullDescription:
      "With a well-appointed private bathroom and a cozy sitting area, this room is perfect for family vacations, group travel, or extended stays, providing comfort, privacy and style in one delightful space.",
    image: "/images/room-img3.webp",
    images: [
      "/images/room-img3.webp",
      "/images/room-img2.webp",
      "/images/room-img1.webp",
    ],
    amenities: [
      "Comfortable Beds for Four",
      "Air Conditioning",
      "LED Flat-screen TV",
      "Private Washroom",
      "Sitting Area",
      "Geyser Facility",
      "24/7 Hot & Cold Water",
      "24/7 Power Backup",
    ],
    features: [
      { icon: Users, label: "4 Guests" },
      { icon: Wind, label: "Air Conditioning" },
      { icon: Tv, label: "LED TV" },
    ],
  },
];

const hotelFacilities = [
  {
    icon: Car,
    label: "Free Parking",
    description: "Complimentary parking for all guests",
  },
  {
    icon: Wifi,
    label: "Free Wi-Fi",
    description: "High-speed internet throughout",
  },
  {
    icon: Coffee,
    label: "Room Service",
    description: "24/7 in-room dining available",
  },
  {
    icon: Phone,
    label: "24/7 Front Desk",
    description: "Always here to help you",
  },
  {
    icon: Shield,
    label: "Secure Stay",
    description: "CCTV surveillance & safety",
  },
  {
    icon: Calendar,
    label: "Flexible Booking",
    description: "Easy cancellation policy",
  },
];

// Room Detail Page Component
function RoomDetail({ roomId, onBack, setSelectedRoomId }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [roomId]);

  const room = roomsData.find((r) => r.id === roomId);
  const similarRooms = roomsData.filter((r) => r.id !== roomId).slice(0, 3);

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      alert("Checkout must be after check-in");
      return;
    }

    try {
      const params = {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults,
        children,
        category: room.category,
      };

      const res = await api.get("/room/search", { params });

      navigate("/booking", {
        state: {
          step: 2,
          checkIn,
          checkOut,
          adults,
          children,
          rooms: res?.data?.data || [],
        },
      });
    } catch (err) {
      console.error(err);
      alert("Search failed");
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-serif text-gray-800 mb-4">
            Room Not Found
          </h2>
          <button
            onClick={onBack}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const reviews = [
    {
      id: 1,
      name: "Ronak Raval",
      rating: 5,
      time: "1 month ago",
      review:
        "Best experience in Rishikesh at Shiv Ganga hotel. Service and room quality is good. Although need to improve washroom. Rest is good.",
    },
    {
      id: 2,
      name: "Nitin nn",
      rating: 5,
      time: "3 weeks ago",
      review:
        "Very amazing hotel in whole Rishikesh — good for all categories of stay.",
    },
    {
      id: 3,
      name: "Shyam Bisht",
      rating: 5,
      time: "1 month ago",
      review:
        "Great service by the team, especially Mr Vinod — very kind and polite. Rooms are good and services are great. Highly recommended.",
    },
    {
      id: 4,
      name: "Manish Jha",
      rating: 5,
      time: "3 weeks ago",
      review:
        "Amazing hotel and clean rooms. If you want to stay in Rishikesh, please stay and enjoy.",
    },
    {
      id: 5,
      name: "Mona Dixit",
      rating: 5,
      time: "1 month ago",
      review:
        "Very nice hotel. Santosh ji was very cooperative, especially with kids. Happy with the facilities.",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={40} />
          </button>
          <img
            src={selectedImage}
            alt="Room View"
            loading="lazy"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Hero Section */}
      <div className="relative h-[70vh] lg:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <ResponsiveImage
            src={room.image}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 text-white">
          <div className="container mx-auto">
            <button
              onClick={onBack}
              className="inline-flex items-center text-gray-300 hover:text-accent-400 mb-8 transition-colors group"
            >
              <ArrowLeft
                size={20}
                className="mr-2 group-hover:-translate-x-1 transition-transform"
              />{" "}
              Back to Rooms
            </button>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-6 leading-tight">
              {room.name}
            </h1>
            <div className="flex flex-wrap items-center gap-8 text-lg">
              <span className="text-accent-400 font-bold text-3xl md:text-4xl">
                {room.price}{" "}
                <span className="text-base md:text-lg text-gray-300 font-normal">
                  /night
                </span>
              </span>
              <div className="h-8 w-px bg-white/20 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={
                        i < Math.floor(room.rating) ? "currentColor" : "none"
                      }
                      className={
                        i < Math.floor(room.rating) ? "" : "text-gray-500"
                      }
                    />
                  ))}
                </div>
                <span className="text-gray-200 font-medium">
                  {room.rating} ({room.reviews} Reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-16">
            {/* Overview */}
            <div>
              <h2 className="text-3xl font-serif text-gray-800 mb-6">
                Room Overview
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-10">
                {room.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
                  <div className="bg-accent-50 p-4 rounded-full text-accent-600">
                    <Maximize size={24} />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500 mb-1">
                      Room Size
                    </span>
                    <span className="font-semibold text-gray-800 text-lg">
                      {room.size}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
                  <div className="bg-accent-50 p-4 rounded-full text-accent-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500 mb-1">
                      Occupancy
                    </span>
                    <span className="font-semibold text-gray-800 text-lg">
                      {room.occupancy}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
                  <div className="bg-accent-50 p-4 rounded-full text-accent-600">
                    <Star size={24} />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500 mb-1">
                      Rating
                    </span>
                    <span className="font-semibold text-gray-800 text-lg">
                      {room.rating}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Amenities */}
            <div>
              <h2 className="text-3xl font-serif text-gray-800 mb-8">
                Features & Amenities
              </h2>

              {/* Detailed Amenities List */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-16">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                  Room Amenities
                </h3>
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                  {room.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 shrink-0 group-hover:bg-accent-600 group-hover:text-white transition-colors">
                        <Check size={14} />
                      </div>
                      <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="mb-16">
                <h2 className="text-3xl font-serif text-gray-800 mb-6">
                  Policies
                </h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Check-in / Check-out
                    </h4>
                    <p className="text-sm text-gray-600">Check-in: 3:00 PM</p>
                    <p className="text-sm text-gray-600">Check-out: 12:00 PM</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Cancellation
                    </h4>
                    <p className="text-sm text-gray-600">
                      Free cancellation up to 24 hours before check-in. Late
                      cancellations are subject to a one-night charge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              <div>
                <div className="flex justify-between items-end mb-8">
                  <h2 className="text-3xl font-serif text-gray-800">
                    Room Gallery
                  </h2>
                  <p className="text-sm text-gray-500 italic">
                    Click to enlarge
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
                  {room.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-xl overflow-hidden cursor-pointer shadow-lg group ${idx === 0 ? "md:col-span-2 md:row-span-2 h-full" : "h-full"}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`${room.name} view ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize
                          className="text-white drop-shadow-lg"
                          size={32}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="pt-16">
                <h2 className="text-3xl font-serif text-gray-800 mb-8">
                  Guest Reviews
                </h2>
                <div className="space-y-6">
                  {reviews.map((review, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {review.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {review.time}
                          </span>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.rating ? "currentColor" : "none"}
                              className={
                                i < review.rating ? "" : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic">"{review.review}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent-600"></div>
                <h3 className="text-2xl font-serif text-gray-800 mb-2">
                  Book This Room
                </h3>
                <p className="text-gray-500 mb-8 text-sm">
                  Best price guarantee • Free cancellation
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Check In - Check Out
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={checkIn}
                        min={today}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-accent-600 focus:border-accent-600 outline-none text-sm"
                      />
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || today}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-accent-600 focus:border-accent-600 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Adults
                    </label>

                    <div className="flex items-center w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-accent-600">
                      <input
                        type="number"
                        min={1}
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="w-full bg-transparent outline-none text-sm"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Adult{adults > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Children
                    </label>

                    <div className="flex items-center w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-accent-600">
                      <input
                        type="number"
                        min={0}
                        value={children}
                        onChange={(e) => setChildren(Number(e.target.value))}
                        className="w-full bg-transparent outline-none text-sm"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Child{children !== 1 ? "ren" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="py-6 border-t border-b border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Base Price</span>
                      <span>{room.price} x 1 night</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-gray-800 text-lg pt-2">
                      <span>Total</span>
                      <span>{room.price}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full bg-accent text-primary py-3 px-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Check className="text-green-500" size={14} />
                    <span>No booking fees</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Check className="text-green-500" size={14} />
                    <span>Instant Confirmation</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-accent-50 rounded-xl p-6 border border-accent-100">
                <h4 className="font-serif text-gray-800 mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Our concierge team is available 24/7 to assist you.
                </p>
                <a
                  href="tel:+911234567890"
                  className="text-accent-600 font-medium hover:underline text-sm"
                >
                  Call +91 123 456 7890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Rooms */}
        <div className="pt-16 border-t border-gray-100">
          <h2 className="text-3xl font-serif text-gray-800 mb-12 text-center">
            You May Also Like
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {similarRooms.map((similarRoom) => (
              <button
                key={similarRoom.id}
                onClick={() => {
                  setSelectedRoomId(similarRoom.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 text-left"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={similarRoom.image}
                    alt={similarRoom.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                    {similarRoom.size}
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-serif text-gray-800 group-hover:text-accent-600 transition-colors">
                      {similarRoom.shortName}
                    </h3>
                    <span className="text-xl font-bold text-accent-600">
                      {similarRoom.price}
                    </span>
                  </div>
                  <p className="text-gray-500 mb-6 line-clamp-2">
                    {similarRoom.description}
                  </p>
                  <span className="inline-flex items-center text-gray-800 font-medium group-hover:translate-x-2 transition-transform">
                    View Details <ChevronRight size={16} className="ml-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location Attractions */}
        <div className="pt-16 border-t border-gray-100">
          <h2 className="text-3xl font-serif text-gray-800 text-center">
            Location Attractions
          </h2>
          <AttractionsList />
        </div>
      </div>
    </div>
  );
}

// Rooms List Page Component
function RoomsList({ onSelectRoom }) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAnimating, setIsAnimating] = useState(false);

  const filteredRooms =
    selectedFilter === "all"
      ? roomsData
      : roomsData.filter((room) => room.category === selectedFilter);

  const handleFilterChange = (filter) => {
    setIsAnimating(true);
    setSelectedFilter(filter);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-accent-50/20 to-gray-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative min-h-[60vh] lg:min-h-[85vh] overflow-hidden bg-slate-900 w-full flex items-center transition-all duration-500">
        {/* Background Image with Animation */}
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="/images/room-img7.webp"
            alt="Luxury Hotel Room"
            className="w-full h-full object-cover blur-[2px] opacity-50 scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
        </div>

        <div className="container mx-auto px-6 h-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-10 lg:py-0">
          {/* Left Side Content */}
          <div className="flex flex-col justify-center text-center lg:text-left lg:items-start max-w-2xl mx-auto lg:mx-0">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Heading */}
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-serif text-white tracking-tight leading-tight mb-5 drop-shadow-lg">
                Our{" "}
                <span className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 leading-[1.2] tracking-tight drop-shadow-2xl text-accent-400">
                  Rooms
                </span>
              </h1>

              {/* accent Divider */}
              <div className="w-16 h-1 bg-accent-400 mb-6 mx-auto lg:mx-0 rounded-full" />

              {/* Description */}
              <p className="text-sm md:text-base text-gray-200 font-light leading-relaxed opacity-90 max-w-lg mx-auto lg:mx-0">
                Elegantly crafted spaces where modern luxury meets timeless
                comfort. <br className="hidden md:block" />
                Each room tells a story of sophisticated design and
                unforgettable experiences.
              </p>
            </motion.div>
          </div>

          {/* Right Side Image Collage */}
          <div className="hidden lg:flex relative h-[500px] w-full justify-center items-center">
            {/* Collage Item 1 - Top Right */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute top-[10%] right-[15%] w-60 h-40 rounded-xl overflow-hidden border-4 border-white/20 shadow-2xl z-10 rotate-6 backdrop-blur-sm"
            >
              <img
                src={roomsData[1].image}
                alt="Room 1"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>

            {/* Collage Item 2 - Left */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute top-[35%] left-[10%] w-72 h-48 rounded-xl overflow-hidden border-4 border-white/20 shadow-2xl z-20 -rotate-3 backdrop-blur-sm"
            >
              <img
                src={roomsData[0].image}
                alt="Room 2"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>

            {/* Collage Item 3 - Bottom */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="absolute bottom-[20%] right-[8%] w-56 h-40 rounded-xl overflow-hidden border-4 border-white/20 shadow-2xl z-30 rotate-3 backdrop-blur-sm"
            >
              <img
                src={roomsData[2].image}
                alt="Room 3"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Filter Tabs */}
        <div className="mb-16">
          {/* Responsive container */}
          <div
            className="
      flex gap-4
      overflow-x-auto sm:overflow-visible
      sm:flex-wrap
      sm:justify-center
      scrollbar-hide
      pb-2
    "
          >
            {[
              { key: "all", label: "All Rooms", icon: Sparkles },
              { key: "standard", label: "Standard", icon: Armchair },
              { key: "deluxe", label: "Deluxe", icon: Star },
              { key: "triple", label: "Triple", icon: Users },
              { key: "family", label: "Family", icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`
          shrink-0
          flex items-center gap-2

          px-6 sm:px-8
          py-2.5 sm:py-3.5

          text-sm font-semibold
          rounded-full
          transition-all duration-300

          ${
            selectedFilter === key
              ? "bg-[#0A2239] text-white shadow-xl scale-105"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-accent hover:scale-105"
          }
        `}
              >
                <Icon
                  size={16}
                  className={
                    selectedFilter === key
                      ? "animate-pulse"
                      : "group-hover:rotate-12 transition-transform"
                  }
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Room Cards Grid */}
        <div
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 transition-opacity duration-300 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          {filteredRooms.map((room, index) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col group transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-72 rounded-br-[60px] overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {room.popular && (
                  <div className="absolute top-4 left-4 bg-accent text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
                    <Star size={14} fill="currentColor" />
                    {room.badge}
                  </div>
                )}

                {!room.popular && room.badge && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur text-gray-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    {room.badge}
                  </div>
                )}

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-gray-800 px-5 py-2.5 rounded-full shadow-xl">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">{room.price}</span>
                    <span className="text-[9px] opacity-70 font-medium">
                      per night
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-serif text-white mb-2 drop-shadow-lg">
                    {room.shortName}
                  </h3>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                  {room.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-xs text-gray-700 bg-accent/50 px-3 py-2 rounded-lg font-medium border border-accent">
                    <Maximize size={14} className="text-accent" /> {room.size}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-2 rounded-lg font-medium border border-blue-100">
                    <Users size={14} className="text-blue-600" />{" "}
                    {room.occupancy}
                  </span>
                  {room.features && room.features[2] && (
                    <span className="flex items-center gap-2 text-xs text-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-2 rounded-lg font-medium border border-green-100">
                      {(() => {
                        const Icon = room.features[2].icon;
                        if (!Icon) return null;
                        return <Icon size={14} className="text-green-600" />;
                      })()}
                      {typeof room.features[2] === "string"
                        ? room.features[2]
                        : room.features[2].label}
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row gap-3  pt-2 w-full shrink-0">
                  <button
                    onClick={() => onSelectRoom(room.id)}
                    className="flex-1 border-2 border-gray-200 py-3 px-4 rounded-xl text-sm font-semibold hover:from-accent hover:to-orange-50 hover:border-accent transition-all duration-300 hover:scale-105"
                  >
                    View Details
                  </button>
                  <Link to="/booking" className="flex-1">
                    <button className="w-full bg-primary text-white py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 group/btn hover:bg-accent transition-all duration-300 hover:scale-105">
                      Book Now
                      <ArrowRight
                        size={16}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hotel Facilities */}
        <div className="bg-gradient-to-br from-white to-accent-50 rounded-3xl p-12 mb-20 shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-gray-800 mb-4">
              World-Class Amenities
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for a comfortable and memorable stay
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotelFacilities.map((facility, idx) => (
              <div
                key={idx}
                className="group bg-white p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <facility.icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {facility.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {facility.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Features Section */}
        <div className="grid md:grid-cols-3 gap-10 pt-12">
          {[
            {
              icon: Check,
              title: "Best Rate Guaranteed",
              desc: "Book directly for the most competitive prices and exclusive benefits",
            },
            {
              icon: Star,
              title: "Premium Experience",
              desc: "Exceptional service and attention to detail in every interaction",
            },
            {
              icon: Shield,
              title: "Safe & Secure",
              desc: "Your safety and privacy are our top priorities",
            },
          ].map((item, idx) => (
            <div key={idx} className="text-center group">
              <div className="w-20 h-20 bg-[#0A2239] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <item.icon size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-serif text-gray-800 mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Rooms Page Component
export default function Rooms() {
  const location = useLocation();
  const state = location?.state || {};

  const initialRoomId =
    state.roomId ||
    state.selectedRoomId ||
    (typeof state.roomIndex === "number"
      ? roomsData[state.roomIndex]?.id || null
      : null);

  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);

  return (
    <div>
      {selectedRoomId ? (
        <RoomDetail
          roomId={selectedRoomId}
          onBack={() => setSelectedRoomId(null)}
          setSelectedRoomId={setSelectedRoomId}
        />
      ) : (
        <RoomsList onSelectRoom={setSelectedRoomId} />
      )}
    </div>
  );
}