import React, { useState } from "react";
import { rooms } from "../../data/rooms";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const RoomSection = () => {
  const navigate = useNavigate();
  const [roomSlides, setRoomSlides] = useState(() =>
    Object.fromEntries(rooms.map((r) => [r.id, 0])),
  );
  const updateRoomSlide = (roomId, direction) => {
    const room = rooms.find((r) => r.id === roomId);
    const total = room?.images?.length ? room.images.length : 1;
    setRoomSlides((prev) => {
      const current = prev[roomId] ?? 0;
      const next = (current + direction + total) % total;
      return { ...prev, [roomId]: next };
    });
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-accent text-xs uppercase tracking-[0.3em] font-bold block mb-4">
            Our Accommodations
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-primary">
            Rooms Designed for Comfort
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {rooms.slice(0, 3).map((room, index) => {
            const slideIndex = roomSlides[room.id] ?? 0;
            const activeImage = room.images?.[slideIndex] || room.image;

            return (
              <motion.div
                key={room.id}
                variants={fadeInUp}
                className="bg-white shadow-sm hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden border border-gray-100 h-full flex flex-col"
              >
                <div className="relative h-[320px] overflow-hidden group shrink-0 rounded-br-[60px]">
                  <motion.img
                    key={`${room.id}-${slideIndex}`}
                    initial={{ opacity: 0.7, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={activeImage}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                  {/* Bestseller tag */}
                  <div className="absolute top-4 left-[-2px]  bg-accent text-white text-xs px-4 py-1 rounded shadow font-bold uppercase tracking-widest z-20">
                    Bestseller
                  </div>
                  <div className="absolute top-5 right-5 z-20 bg-white/95 backdrop-blur text-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-2xl">
                    {room.price}{" "}
                    <span className="text-[8px] opacity-70">+ Taxes</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRoomSlide(room.id, -1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-primary hover:scale-110"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRoomSlide(room.id, 1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-primary hover:scale-110"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                    <h3 className="text-2xl font-serif mb-1">{room.name}</h3>
                    <div className="text-xs uppercase tracking-widest opacity-80">
                      Per Night
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(room.features || []).slice(0, 6).map((f, idx) => (
                      <div
                        key={typeof f === "string" ? `f-${idx}` : f.label}
                        className="flex items-center gap-2 text-primary text-xs font-medium"
                      >
                        {f.icon ? (
                          <f.icon size={16} className="text-accent" />
                        ) : null}
                        <span className="truncate">
                          {typeof f === "string" ? f : f.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col lg:flex-row gap-3 mt-4 pt-2 w-full shrink-0">

  <button
    type="button"
    onClick={() => navigate("/booking")}
    className="
      w-full lg:flex-1
      
      min-h-[44px] sm:min-h-[48px]
      px-4 sm:px-5 md:px-6
      
      btn-primary
      
      text-[11px] sm:text-xs md:text-sm
      uppercase tracking-[0.12em] sm:tracking-[0.15em]
      font-bold
      
      rounded-lg sm:rounded-xl md:rounded-2xl
      
      cursor-pointer
      hover:bg-accent
      active:scale-[0.98]
      transition-all duration-200
      
      flex items-center justify-center
    "
  >
    Book Now
  </button>

  <button
    type="button"
    onClick={() =>
      navigate("/rooms", {
        state: { roomIndex: index },
      })
    }
    className="
      w-full lg:flex-1
      
      min-h-[44px] sm:min-h-[48px]
      px-4 sm:px-5 md:px-6
      
      border border-gray-200
      text-primary
      
      text-[11px] sm:text-xs md:text-sm
      uppercase tracking-[0.12em] sm:tracking-[0.15em]
      font-bold
      
      rounded-lg sm:rounded-xl md:rounded-2xl
      
      cursor-pointer
      hover:bg-primary hover:text-white hover:border-primary
      transition-all duration-200
      
      flex items-center justify-center
    "
  >
    View Details
  </button>

</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-15 text-center">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-accent transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 rounded-2xl group"
          >
            View All Accommodations
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RoomSection;
