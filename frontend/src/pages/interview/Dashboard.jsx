import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useInterview } from "../../hooks/useInterview.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getInterviewStats } from "../../services/interview.api.js";
import { Plus, Sparkles, LogOut, Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { DashboardStats } from '../../components/interview/DashboardStats.jsx';
import { ReportCardGrid } from '../../components/interview/ReportCard.jsx';
import { toast } from "sonner";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import { MOTIVATIONAL_QUOTES } from "../../lib/quotes.js";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MuiPagination from "@mui/material/Pagination";

const Dashboard = () => {
    const { loading, reports, getReports, deleteReport } = useInterview();
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();

    // Search, filter, and pagination state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [minScore, setMinScore] = useState(0);
    const [paginationInfo, setPaginationInfo] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
    const [stats, setStats] = useState({ totalPlans: 0, averageMatch: 0, bestMatch: 0 });
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch stats on mount and whenever reports collection changes
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getInterviewStats();
                if (data && data.stats) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
            }
        };
        fetchStats();
    }, [reports]);

    // Fetch reports with page/search/filter changes
    useEffect(() => {
        const fetchReports = async () => {
            const meta = await getReports({ page, search, minScore });
            if (meta) {
                setPaginationInfo(meta);
            }
            setInitialLoading(false);
        };

        const debounceTimer = setTimeout(fetchReports, 300);
        return () => clearTimeout(debounceTimer);
    }, [page, search, minScore, getReports]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1 on new search
    };

    const handleMinScoreChange = (val) => {
        setMinScore(Number(val));
        setPage(1); // Reset to page 1 on new filter
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this interview plan?")) {
            try {
                await deleteReport(id);
                toast.success("Interview plan deleted successfully");
                // Refetch to align pagination
                const meta = await getReports({ page, search, minScore });
                if (meta) {
                    setPaginationInfo(meta);
                }
            } catch (err) {
                toast.error("Failed to delete interview plan");
            }
        }
    };

    // Convert stats object to shape expected by DashboardStats component
    const plansStatsMock = [];
    if (stats.totalPlans > 0) {
        if (stats.totalPlans === 1) {
            plansStatsMock.push({ matchScore: stats.averageMatch });
        } else {
            plansStatsMock.push({ matchScore: stats.bestMatch });
            const remainingSum = (stats.averageMatch * stats.totalPlans) - stats.bestMatch;
            const remainingAverage = remainingSum / (stats.totalPlans - 1);
            for (let i = 1; i < stats.totalPlans; i++) {
                plansStatsMock.push({ matchScore: remainingAverage });
            }
        }
    }

    return (
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center">
            <LoadingScreen
                active={initialLoading}
                minDelay={1000}
                quotes={MOTIVATIONAL_QUOTES}
                message="Loading your dashboard..."
            />
            {/* Top Header */}
            <header className="sticky top-0 z-10 w-full border-b bg-background/80 px-4 backdrop-blur">
                <div className="mx-auto w-full max-w-5xl flex h-14 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <span className="text-lg font-medium text-foreground">Welcome, <span className="text-primary">{user?.username || "Guest"}</span> !</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="default"
                            size="default"
                            render={<Link to="/" />}
                            className="gap-1.5 cursor-pointer font-semibold"
                        >
                            <ArrowLeft size={15} />
                            <span>Create Plan</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={handleLogout}
                            className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-semibold"
                        >
                            <LogOut size={15} />
                            <span>Log out</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10 flex flex-col gap-8 w-full">
                {/* Heading */}
                <section>
                    <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
                        Interview Preparation <span className="text-primary">Dashboard</span>
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your tailored interview roadmaps, track matching scores, and practice mock questions.
                    </p>
                </section>

                {/* Stats Section */}
                {stats.totalPlans > 0 && (
                    <section>
                        <DashboardStats plans={plansStatsMock} />
                    </section>
                )}

                {/* List Section */}
                <section className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-balance">My Saved Reports</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                All generated strategies and compatibility evaluations.
                            </p>
                        </div>

                        {stats.totalPlans > 0 && (
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search Input */}
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 size-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search plans..."
                                        value={search}
                                        onChange={handleSearchChange}
                                        className="pl-9 w-full md:w-60"
                                    />
                                </div>

                                {/* Min Score filter dropdown */}
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="size-4 text-muted-foreground shrink-0" />
                                    <Select
                                        value={String(minScore)}
                                        onValueChange={(val) => handleMinScoreChange(Number(val))}
                                    >
                                        <SelectTrigger className="w-44 h-10">
                                            <SelectValue placeholder="All Scores" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">All Scores</SelectItem>
                                            <SelectItem value="80">Good Match (≥ 80%)</SelectItem>
                                            <SelectItem value="60">Average Match (≥ 60%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cards Grid / Empty state */}
                    {stats.totalPlans === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center space-y-4">
                            <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold">No strategies generated yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm text-balance">
                                Upload your resume and drop in a job description link to get your first custom interview playbook.
                            </p>
                            <Button
                                variant="default"
                                render={<Link to="/" />}
                                className="gap-2 cursor-pointer font-semibold"
                            >
                                <Plus size={16} />
                                <span>Create Your First Plan</span>
                            </Button>
                        </div>
                    ) : reports && reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                            <p className="text-sm text-muted-foreground">No interview plans found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            <ReportCardGrid plans={reports} onDelete={handleDelete} />

                            {/* Pagination Controls */}
                            {paginationInfo.totalPages > 1 && (
                                <div className="flex justify-center pt-6">
                                    <MuiPagination
                                        count={paginationInfo.totalPages}
                                        page={page}
                                        onChange={(event, value) => setPage(value)}
                                        variant="outlined"
                                        shape="rounded"
                                        sx={{
                                            '& .MuiPaginationItem-root': {
                                                color: 'hsl(var(--muted-foreground))',
                                                borderColor: 'hsl(var(--border))',
                                                fontFamily: 'inherit',
                                                '&:hover': {
                                                    backgroundColor: 'hsl(var(--accent))',
                                                    color: 'hsl(var(--accent-foreground))',
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: 'hsl(var(--primary))',
                                                    color: 'hsl(var(--primary-foreground))',
                                                    borderColor: 'hsl(var(--primary))',
                                                    '&:hover': {
                                                        backgroundColor: 'hsl(var(--primary) / 0.8)',
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
