import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"
import { LoginModal } from "@/components/LoginModal"
import { useAuthContext } from "@/context/AuthContext"

export function Header() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const initials = user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? ""

  return (
    <>
      <header className="flex items-center justify-between px-8 py-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img
            src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"
            alt="Кабинет-24"
            className="h-28 w-auto object-contain"
          />
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate("/")} className="text-sm text-gray-300 hover:text-white transition-colors">
            Маркетплейс
          </button>
          <button onClick={() => navigate("/ecosystem")} className="text-sm text-gray-300 hover:text-white transition-colors">
            Экосистема
          </button>
          <button onClick={() => navigate("/referral")} className="text-sm text-gray-300 hover:text-white transition-colors">
            Реферальная программа
          </button>
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full border border-[#262626] bg-[#141414] pr-3 pl-1 py-1 hover:border-violet-500/50 transition-colors">
                <Avatar className="h-7 w-7">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-white max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                <Icon name="ChevronDown" className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141414] border-[#262626] text-white w-48">
              <DropdownMenuItem
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 cursor-pointer hover:bg-[#1f1f1f] focus:bg-[#1f1f1f]"
              >
                <Icon name="LayoutDashboard" className="h-4 w-4 text-blue-400" />
                Личный кабинет
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
              >
                <Icon name="LogOut" className="h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
              onClick={() => setLoginOpen(true)}
            >
              Войти
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 bg-transparent"
              onClick={() => setRegisterOpen(true)}
            >
              Зарегистрироваться
            </Button>
          </div>
        )}
      </header>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} onRegister={() => { setLoginOpen(false); setRegisterOpen(true) }} />
    </>
  )
}