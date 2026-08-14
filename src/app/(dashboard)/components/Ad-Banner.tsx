import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function AdBanner() {
  return (
    <Card className="h-[200px] overflow-hidden shadow-md rounded-2xl">
      <Link href="#" className="block h-full">
        <CardContent className="p-0 h-full flex flex-row items-center">
          <div className="relative h-full w-[200px] flex-shrink-0">
            <Image
              src="/alajo33.png"
              alt="Ajo/Esusu App"
              width={200}
              height={200}
              className="object-cover h-full w-full"
            />
          </div>
          <div className="p-6 flex flex-col justify-center">
            <CardTitle className="text-lg font-bold">
              Download Our Ajo/Esusu App!
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Track your group contributions, payouts, and cycles anytime,
              anywhere.
            </CardDescription>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
