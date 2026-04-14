import { Shield, MapPin, Home, Plane, Anchor, Crosshair, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const BOARDS_DATA = {
  army: [
    {
      city: "Allahabad (Prayagraj)",
      boards: [
        { name: "11 SSB", code: "35XXX" },
        { name: "14 SSB", code: "71XXX" },
        { name: "18 SSB", code: "38XXX" },
        { name: "19 SSB", code: "39XXX" },
        { name: "34 SSB", code: "46XXX" }
      ],
      address: "Selection Centre Central, Cantt Rd, Old Cantt, Prayagraj, UP 211001",
      stay: "Dharmshala inside SSB - ₹200/head, 600m from centre (Best option; call letter mandatory before check-in). Hotel Veenit - ₹250/night, Dormitory by Ex-Army Officer - ₹1000/night, includes free drop facility in the morning."
    },
    {
      city: "Bhopal",
      boards: [
        { name: "20 SSB", code: "40XXX" },
        { name: "21 SSB", code: "72XXX" },
        { name: "22 SSB", code: "42XXX" }
      ],
      address: "Selection Centre South, Bairagarh, Bhopal, MP 462030",
      stay: "Jain Dharmshala - ₹200/head, 800m from centre, ₹50 for dinner; opposite Gufa Mandir, Dev Begas Sainik Aramgrah - Contact: 96859 62886, Address: Sardar Vallabh Bhai Patel Polytechnic Chouraha, 45 Bunglows, North TT Nagar, Bhopal - 462003"
    },
    {
      city: "Bengaluru",
      boards: [
        { name: "17 SSB", code: "63XXX" },
        { name: "24 SSB", code: "68XXX" }
      ],
      address: "Selection Centre South, 1 Richmond Rd, Langford Town, Bengaluru, KA 560025",
      stay: "Sri Sri Ravishankar Bal Mandir - ₹150/day, 3.1km from centre, Location: Kanakapura Rd, opposite Art of Living Ashram, Hotel Townhall - ₹650/head"
    },
    {
      city: "Jalandhar",
      boards: [
        { name: "31 SSB", code: "81XXX" },
        { name: "32 SSB", code: "92XXX" }
      ],
      address: "Selection Centre North, Military Station, Cantt, Jalandhar, PB 144005",
      stay: "Sodhi PG - ₹100/night, Address: H.No.43, Modern Estate, near Pinky Tent House, Dakoha, Rama Mandir, Jalandhar, Contact: 9872738031, 8437388717, Comfort PG - ₹700 (single), ₹900 (3-person room), 1 km from centre, Babri Dharmshala (SSB Stay) - Dormitory & PG, 27-B Beant Nagar, Contact: 9465331052"
    }
  ],
  airforce: [
    {
      name: "1 AFSB - Dehradun",
      unit: "1 AFSB",
      address: "Air Force Selection Board, Clement Town, Dehradun, UK 248002",
      stay: "Dolphin Guest House - ₹1000/person, 10m from centre, Doon Valley Homestay"
    },
    {
      name: "2 AFSB - Mysore",
      unit: "2 AFSB",
      address: "Air Force Selection Board, Nazarbad, Mysuru, KA 570010",
      stay: "Ginger Mysore - 800m from centre, Shreyas Residency - ₹650/head"
    },
    {
      name: "3 AFSB - Gandhinagar",
      unit: "3 AFSB",
      address: "Air Force Selection Board, Sector 7, Gandhinagar, Gujarat 382007",
      stay: "Kadva Patidar Samaj - Pocket-friendly, Youth Hostel - ₹135/head"
    },
    {
      name: "4 AFSB - Varanasi",
      unit: "4 AFSB",
      address: "Air Force Selection Board, BHU Campus, Varanasi, UP 221005",
      stay: "Om Inn Hotel Residency - ₹700/head, IRCTC Dormitory - Budget stay"
    },
    {
      name: "5 AFSB - Guwahati",
      unit: "5 AFSB",
      address: "Air Force Selection Board, Borjhar, Near Airport, Guwahati, Assam 781015",
      stay: "Royal Arunachalee Guest House"
    }
  ],
  navy: [
    {
      name: "NSB - Coimbatore (INS Agrani)",
      unit: "NSB",
      address: "INS Agrani, Naval Base, Vattamaialpalayam, Coimbatore, TN 641015",
      stay: "Closest airport: Coimbatore International Airport"
    },
    {
      name: "12 SSB - Bangalore",
      unit: "12 SSB",
      address: "Selection Centre South, 1 Richmond Rd, Langford Town, Bengaluru, KA 560025",
      stay: "Cubbon Road, accessible by Kempegowda International Airport"
    },
    {
      name: "33 SSB - Bhopal",
      unit: "33 SSB",
      address: "Inside Selection Centre South Complex, Bairagarh, Bhopal, MP 462030",
      stay: "Inside 21 SSB complex, 5km from Bhopal Junction"
    },
    {
      name: "NSB - Kolkata",
      unit: "NSB",
      address: "Naval Selection Board, Garden Reach, Kolkata, WB 700024",
      stay: "Gurudwara Bara Sikh Sangat - ₹300/day (Food Included)"
    },
    {
      name: "NSB - Visakhapatnam (INS Kalinga)",
      unit: "NSB",
      address: "INS Kalinga, Naval Base, Bheemunipatnam, Visakhapatnam, AP 531163",
      stay: "Near Visakhapatnam Railway Station"
    }
  ]
};

export default function SelectionBoards() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'army' | 'airforce' | 'navy'>('all');

  const filteredArmy = BOARDS_DATA.army.filter(b => 
    (activeFilter === 'all' || activeFilter === 'army') &&
    (b.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.boards.some(board => board.name.toLowerCase().includes(searchQuery.toLowerCase()) || board.code.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredAirforce = BOARDS_DATA.airforce.filter(b => 
    (activeFilter === 'all' || activeFilter === 'airforce') &&
    (b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.unit.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredNavy = BOARDS_DATA.navy.filter(b => 
    (activeFilter === 'all' || activeFilter === 'navy') &&
    (b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.unit.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20 scroll-reveal"
    >
      <motion.div variants={itemVariants} className="glass-card glow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="h-32 w-32 text-gold" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading font-black mb-4 tracking-tight">
            <span className="shimmer-text">SSB SELECTION BOARDS</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-2xl leading-relaxed mb-6">
            Quick reference guide for Army, Air Force, and Navy Selection Boards across India, including addresses and stay options.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search boards by city, code, or name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-background/50 border border-border/40 focus:border-gold/50 outline-none font-body text-sm transition-all"
              />
            </div>
            <div className="flex p-1 rounded-lg bg-background/50 border border-border/40 w-fit">
              {(['all', 'army', 'airforce', 'navy'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === f ? 'bg-gold/20 text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? 'All Units' : f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Army Boards */}
      {filteredArmy.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Crosshair className="h-5 w-5 text-gold" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground tracking-wide uppercase">Army Selection Boards</h2>
          </div>
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredArmy.map((board, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ scale: 1.01, translateY: -4 }}
                className="glass-card group transition-all duration-300 border-gold/10 hover:border-gold/30"
              >
              <div className="flex flex-wrap gap-2 mb-4">
                {board.boards.map((b, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-gold/10 text-gold text-[10px] font-bold border border-gold/20 uppercase tracking-tighter">
                    {b.name} - {b.code}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2 group-hover:text-gold transition-colors">
                <MapPin className="h-4 w-4 text-gold/60" />
                {board.city}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black mb-1.5">Primary Address</p>
                  <p className="text-sm font-body text-foreground/70 leading-relaxed font-medium">{board.address}</p>
                </div>
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 shadow-inner group-hover:bg-gold/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-3.5 w-3.5 text-gold" />
                    <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Recommended Stay</p>
                  </div>
                  <p className="text-xs font-body text-muted-foreground leading-relaxed italic">{board.stay}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
      )}

      {/* Air Force Boards */}
      {filteredAirforce.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Plane className="h-5 w-5 text-sky-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground tracking-wide uppercase">Air Force Selection Boards</h2>
          </div>
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAirforce.map((board, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ scale: 1.01, translateY: -4 }}
                className="glass-card group transition-all duration-300 border-sky-500/10 hover:border-sky-500/30"
              >
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-500/20 mb-3 inline-block uppercase tracking-widest">
                  {board.unit}
                </span>
                <h3 className="text-lg font-heading font-bold mb-4 group-hover:text-sky-300 transition-colors">{board.name}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black mb-1.5">Establishment Address</p>
                    <p className="text-xs font-body text-foreground/70 leading-relaxed font-medium">{board.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 shadow-inner group-hover:bg-sky-500/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-3.5 w-3.5 text-sky-400" />
                      <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Stay Information</p>
                    </div>
                    <p className="text-xs font-body text-muted-foreground leading-relaxed italic">{board.stay}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Navy Boards */}
      {filteredNavy.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Anchor className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground tracking-wide uppercase">Naval Selection Boards</h2>
          </div>
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredNavy.map((board, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ scale: 1.01, translateY: -4 }}
                className="glass-card group transition-all duration-300 border-emerald-500/10 hover:border-emerald-500/30"
              >
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 mb-3 inline-block uppercase tracking-widest">
                  {board.unit}
                </span>
                <h3 className="text-lg font-heading font-bold mb-4 group-hover:text-emerald-300 transition-colors">{board.name}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black mb-1.5">Naval Base Address</p>
                    <p className="text-xs font-body text-foreground/70 leading-relaxed font-medium">{board.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 shadow-inner group-hover:bg-emerald-500/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-3.5 w-3.5 text-emerald-400" />
                      <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Stay & Logistics</p>
                    </div>
                    <p className="text-xs font-body text-muted-foreground leading-relaxed italic">{board.stay}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {filteredArmy.length === 0 && filteredAirforce.length === 0 && filteredNavy.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-20">
          <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border border-border/40">
            <Search className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground/80 mb-2">No Selection Boards Found</h3>
          <p className="text-sm text-muted-foreground font-body">Try adjusting your search or the service filters.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
