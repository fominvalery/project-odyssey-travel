import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown } from "lucide-react"
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
      <header className="flex items-center justify-between px-8 py-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <EstateProLogo />
          <span className="text-lg font-semibold text-white">
            Кабинет-24
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Объекты
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            Направления <ChevronDown className="h-4 w-4" />
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Маркетплейс
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Тарифы
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Контакты
          </a>
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
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#141414] border-[#262626] text-white w-48">
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 cursor-pointer hover:bg-[#1f1f1f] focus:bg-[#1f1f1f]"
              >
                <Icon name="User" className="h-4 w-4 text-gray-400" />
                Мой профиль
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
              className="rounded-full border-violet-500 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 bg-transparent"
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

function EstateProLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z" fill="#8B5CF6" />
      <path d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z" fill="#8B5CF6" opacity="0.3" />
      <rect x="9" y="15" width="6" height="6" fill="#8B5CF6" opacity="0.6" />
    </svg>
  )
}