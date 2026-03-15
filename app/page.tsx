import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import BudgetItem from "./components/BudgetItem";
import budgets from "./data";


export default function Home() {
  return (
    <div>
      <Navbar /> {/*La barre de nav */}
      <div className="flex items-center jsutify-center flex-col py-10 w-full">
        <div>
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              Prenez le <span className="text-emerald-500 underline decoration-wavy"> contrôle </span>  <br /> de vos <span className="text-yellow-500 text-4xl md:text-5xl underline decoration-dotted "> finances </span>
            </h1>
            <p className="py-6 text-gray-800 text-center">Suivez vos budgets et vos dépense <br />en toute simplicité avec
              notre application intuitive !
            </p>
            <div className="flex justify-center items-center">
              <Link href={"/sign-in"}
                className="btn bnt-sm md:btn-md btn-outline btn-accent"
              >
                Se connecter
              </Link>

              <Link href={"/sign-up"}
                className="btn bnt-sm md:btn-md  btn-accent ml-2"
              >
                S'inscrire
              </Link>

            </div>

            <ul className='grid grid-cols-1 gap-1 p-1 md:grid-cols-3 md:gap-4 md:p-4 md:min-w-[1000px] md:mt-6'>
              {budgets.map((budget) => (
                <Link href={''} key={budget.id} className="block">
                  <BudgetItem budget={budget} enableHover={1} />
                </Link>
              ))}
            </ul>



          </div>
        </div>
      </div>
    </div>
  );
}
