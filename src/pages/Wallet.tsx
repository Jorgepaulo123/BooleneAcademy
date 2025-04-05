
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet as WalletIcon, Loader2, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getWalletBalance, getWalletTransactions, initializeDeposit } from "@/lib/api";
import { Wallet as WalletType, WalletTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const depositFormSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be greater than zero" }
  ),
  mobile: z.string().min(10, {
    message: "Invalid phone number",
  }),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

const Wallet = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletType>({ balance: 0, transactions: [] });
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: "",
      mobile: "",
    },
  });

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const balanceData = await getWalletBalance();
      const transactionsData = await getWalletTransactions();
      
      setWallet({
        balance: balanceData?.balance || 0,
        transactions: transactionsData?.transactions || [],
      });
    } catch (error) {
      console.error("Failed to load wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isAuthenticated) {
      loadWalletData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const onDepositSubmit = async (values: DepositFormValues) => {
    try {
      const result = await initializeDeposit(Number(values.amount), values.mobile);
      
      if (result) {
        toast({
          title: "Deposit Initiated",
          description: "The amount has been added to your wallet.",
        });
        setDepositDialogOpen(false);
        depositForm.reset();
        loadWalletData();
      }
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "MWK",
    });
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status !== "completed") {
      return <RefreshCw className="h-5 w-5 text-muted-foreground" />;
    }

    if (type === "deposit") {
      return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "purchase":
        return "Course Purchase";
      default:
        return type;
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-primary/20 p-3 rounded-full mr-4">
              <WalletIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Wallet</h1>
              <p className="text-muted-foreground">
                Manage your funds and transactions
              </p>
            </div>
          </div>
          <Button onClick={() => loadWalletData()} variant="outline" className="hidden sm:flex">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="animate-slide-up opacity-0">
                <CardHeader className="pb-4">
                  <CardTitle>Available Balance</CardTitle>
                  <CardDescription>Your current balance on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {formatAmount(wallet.balance)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Funds
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Funds</DialogTitle>
                        <DialogDescription>
                          Enter the amount and phone number to add funds to your wallet.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...depositForm}>
                        <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                          <FormField
                            control={depositForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (MWK)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    {...field}
                                    className="bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={depositForm.control}
                            name="mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(XX) XXXXX-XXXX"
                                    {...field}
                                    className="bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">
                            Confirm Deposit
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>

              <Card className="animate-slide-up opacity-0" style={{ animationDelay: "0.1s" }}>
                <CardHeader className="pb-4">
                  <CardTitle>Wallet Summary</CardTitle>
                  <CardDescription>Statistics of your financial activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Deposits</span>
                      <span className="font-medium">
                        {formatAmount(
                          wallet.transactions
                            .filter(t => t.transaction_type === "deposit" && t.status === "completed")
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Purchases</span>
                      <span className="font-medium">
                        {formatAmount(
                          wallet.transactions
                            .filter(t => t.transaction_type === "purchase" && t.status === "completed")
                            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number of Transactions</span>
                      <span className="font-medium">{wallet.transactions.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => loadWalletData()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Data
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card className="animate-slide-up opacity-0" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Recent transactions in your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wallet.transactions.length === 0 ? (
                  <div className="text-center py-10">
                    <WalletIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallet.transactions.map((transaction, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-muted rounded-full p-2">
                            {getTransactionIcon(transaction.transaction_type, transaction.status)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {getTransactionText(transaction.transaction_type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.payment_ref && `Ref: ${transaction.payment_ref.substring(0, 8)}...`}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {formatAmount(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Wallet;
