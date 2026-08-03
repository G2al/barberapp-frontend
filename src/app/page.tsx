"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { BrandLoader } from "@/components/ui/brand-loader";

export default function Page() { const { user, loading } = useAuth(); const router = useRouter(); useEffect(() => { if (!loading) router.replace(user ? "/home" : "/login"); }, [loading, router, user]); return <BrandLoader />; }
