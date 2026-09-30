
import FloatingElements from "./FloatingElements";
import { Code, Brain, Bot, Sparkles } from "lucide-react";
import logo2 from "../../assets/SuperTeacher1.png";
import "./login.css"

const HeroSection = () => {
    const features = [
        { icon: Code, label: "Coding", description: "Learn programming languages" },
        { icon: Brain, label: "AI", description: "Learn artificial intelligence" },
        { icon: Bot, label: "Robotics", description: "Build and program robots" },
    ];

    return (
        <div className="relative  hero-gradient overflow-hidden flex flex-col justify-between gap-4 py-4 px-6 lg:px-14">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <FloatingElements />

            {/* Content */}
            <div className="relative z-10 max-w-lg animate-fade-in">
                <div className="mb-4">
                    <img src={logo2} alt="" width={200} />
                </div>

                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-white/90 text-sm font-medium">building Future</span>
                </div>


                <h2 className="text-3xl lg:text-4xl font-display font-bold text-white/90 mb-4">
                    Learn to Build
                    <br />
                    <span className="text-gradient">Tomorrow's World</span>
                </h2>

                <p className="text-white/80 text-lg mb-6">
                    Empower yourself with cutting-edge skills in coding, artificial intelligence, and robotics. Join thousands of students shaping the future.
                </p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {features.map((feature) => (
                        <div
                            key={feature.label}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                        >
                            <feature.icon className="w-8 h-8 text-accent mx-auto mb-2" />
                            <h3 className="text-white font-semibold text-sm">{feature.label}</h3>
                            <p className="text-white/60 text-xs mt-1">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
