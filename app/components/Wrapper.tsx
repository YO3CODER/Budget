import Navbar from "./Navbar"
import BottomNav from "./BottomNav"

type WrapperProps = {
  children: React.ReactNode
}

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div>
      <Navbar />
      <div className="px-5 md:px-[10%] mt-10 mb-10 pb-24 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}

export default Wrapper