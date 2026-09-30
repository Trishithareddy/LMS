import { Code, Zap, GraduationCap, Pencil, BookMarked } from "lucide-react";

const FloatingElements = () => {
  return (
    <>
      {/* Floating Icons */}
      
      <div className="absolute top-28 right-14  opacity-60">
        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-yellow-300" />
        </div>
      </div>
      
      <div className="absolute bottom-20 left-16  opacity-60">
        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <BookMarked className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      
      <div className="absolute top-1/2 left-8  opacity-50">
        <div className="w-8 h-8 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center">
          <Pencil className="w-5 h-5 text-yellow-400" />
        </div>
      </div>
      
      <div className="absolute top-40 left-1/3  opacity-50">
        <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
    </>
  );
};

export default FloatingElements;
