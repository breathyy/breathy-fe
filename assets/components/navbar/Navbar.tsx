import Link from "next/link";
import Button from "../Button";
import Image from "next/image";
import styles from "./Navbar.module.css";

import logo from "./../../logo/logo.png"

export default function Navbar() {
	return (
		<header className="w-full py-6">
			<nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/" className="flex items-center gap-2 font-bold text-pink-500 text-xl">
						<Image src={logo} alt="Breathy Logo" width={120} />
					</Link>
				</div>

				<ul className="hidden md:flex items-center gap-16 text-sm text-gray-700">
					<li>
						<Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
					</li>
					<li>
						<Link href="/tentang" className={styles.navLink}>Tentang</Link>
					</li>
					<li>
						<Link href="/chatbot" className={styles.navLink}>Chatbot</Link>
					</li>
				</ul>

				<div className="flex items-center gap-4">
					<Link href="/login" className={`${styles.login} text-sm text-gray-700`}>Masuk</Link>
					<Button href="/register">Daftar</Button>
				</div>
			</nav>
		</header>
	);
}
