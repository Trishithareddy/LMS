import HeroSection from "./HeroSection";
import LoginForm from "./LoginForm";
import "./login.css"

const Login = () => {
  return (
    
    <main className="flex flex-col lg:flex-row max-w-[80%] mx-auto bg-shadow rounded-xl overflow-hidden my-4 ">
      {/* Left Side - Hero Section */}
      <section className="hidden lg:flex lg:w-1/2 ">
        <HeroSection />
      </section>

      {/* Right Side - Login Form */}
      <section className="flex-1 flex items-center justify-center px-5 bg-[#ffffff] py-3">
        <LoginForm />
      </section>

      {/* Mobile Hero (shown only on small screens) */}
      <div className="lg:hidden fixed inset-0 -z-10 opacity-10" />
    </main>
  );
};

export default Login;
