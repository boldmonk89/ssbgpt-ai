import { Shield, MapPin, Home, Plane, Anchor, Crosshair } from 'lucide-react';

const BOARDS_DATA = {
  army: [
    {
      city: "Allahabad (Prayagraj)",
      boards: ["11 SSB", "14 SSB", "18 SSB", "19 SSB", "34 SSB"],
      address: "Selection Centre Central, Cantt Rd, Old Cantt, Prayagraj, UP 211001",
      stay: "Dharmshala inside SSB - ₹200/head, 600m from centre (Best option; call letter mandatory before check-in). Hotel Veenit - ₹250/night, Dormitory by Ex-Army Officer - ₹1000/night, includes free drop facility in the morning."
    },
    {
      city: "Bhopal",
      boards: ["20 SSB", "21 SSB", "22 SSB"],
      address: "Selection Centre South, Bairagarh, Bhopal, MP 462030",
      stay: "Jain Dharmshala - ₹200/head, 800m from centre, ₹50 for dinner; opposite Gufa Mandir, Dev Begas Sainik Aramgrah - Contact: 96859 62886, Address: Sardar Vallabh Bhai Patel Polytechnic Chouraha, 45 Bunglows, North TT Nagar, Bhopal - 462003"
    },
    {
      city: "Bengaluru",
      boards: ["17 SSB", "24 SSB"],
      address: "Selection Centre South, 1 Richmond Rd, Langford Town, Bengaluru, KA 560025",
      stay: "Sri Sri Ravishankar Bal Mandir - ₹150/day, 3.1km from centre, Location: Kanakapura Rd, opposite Art of Living Ashram, Hotel Townhall - ₹650/head"
    },
    {
      city: "Jalandhar",
      boards: ["31 SSB", "32 SSB"],
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
  return (
    <div className="space-y-12 pb-20 scroll-reveal">
      <div className="glass-card glow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="h-32 w-32 text-gold" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading font-black mb-4 tracking-tight">
            <span className="shimmer-text">SSB SELECTION BOARDS</span>
          </h1>
          <p className="text-muted-foreground font-body text-base max-w-2xl leading-relaxed">
            Quick reference guide for Army, Air Force, and Navy Selection Boards across India, including addresses and stay options.
          </p>
        </div>
      </div>

      {/* Army Boards */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Crosshair className="h-5 w-5 text-orange-500" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-orange-500 tracking-wide uppercase">Army Boards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BOARDS_DATA.army.map((board, i) => (
            <div key={i} className="glass-card group hover:scale-[1.01] transition-transform duration-300 border-orange-500/10 hover:border-orange-500/30">
              <div className="flex flex-wrap gap-2 mb-4">
                {board.boards.map((num, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-bold border border-orange-500/20">
                    {num}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                {board.city}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Address</p>
                  <p className="text-sm font-body text-foreground/80 leading-relaxed">{board.address}</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-3.5 w-3.5 text-orange-500" />
                    <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Stay Options</p>
                  </div>
                  <p className="text-xs font-body text-orange-200/70 leading-relaxed">{board.stay}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Air Force Boards */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Plane className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-blue-400 tracking-wide uppercase">Air Force Boards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOARDS_DATA.airforce.map((board, i) => (
            <div key={i} className="glass-card group hover:scale-[1.01] transition-transform duration-300 border-blue-500/10 hover:border-blue-500/30">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 mb-3 inline-block">
                {board.unit}
              </span>
              <h3 className="text-lg font-heading font-bold mb-4">{board.name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Address</p>
                  <p className="text-xs font-body text-foreground/80 leading-relaxed">{board.address}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Stay Options</p>
                  </div>
                  <p className="text-xs font-body text-blue-100/60 leading-relaxed">{board.stay}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navy Boards */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Anchor className="h-5 w-5 text-teal-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-teal-400 tracking-wide uppercase">Navy Boards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOARDS_DATA.navy.map((board, i) => (
            <div key={i} className="glass-card group hover:scale-[1.01] transition-transform duration-300 border-teal-500/10 hover:border-teal-500/30">
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/20 mb-3 inline-block">
                {board.unit}
              </span>
              <h3 className="text-lg font-heading font-bold mb-4">{board.name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Address</p>
                  <p className="text-xs font-body text-foreground/80 leading-relaxed">{board.address}</p>
                </div>
                <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-3.5 w-3.5 text-teal-400" />
                    <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">Stay Options</p>
                  </div>
                  <p className="text-xs font-body text-teal-100/60 leading-relaxed">{board.stay}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
