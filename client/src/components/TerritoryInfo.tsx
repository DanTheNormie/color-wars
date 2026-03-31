import { Drawer, DrawerContent } from "./ui/drawer";
import { useInfoDrawerStore } from "@/stores/InfoDrawerStore";
import { useMapStore } from "@/stores/mapStateStore";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/sessionStore";

export default function AssetManager() {
  const [hasBase, setHasBase] = useState(false);
  const [property, setProperty] = useState<string | null>(null);
  const buyTerritory = useStore((z)=> z.buyTerritory)
  const sellTerritory = useStore((z)=> z.sellTerritory)
  const territoryID = useMapStore((z)=>z.selectedTerritoryId)
  const getTerritoryEconomy = useMapStore((z)=>z.getEconomyData)
  
  const activePlayerId = useStore((s) => s.state.game?.activePlayerId);
  const currentPlayerId = useStore((s) => s.currentPlayer?.id);
  const isMyTurn = currentPlayerId === activePlayerId;
  const hasBoughtThisRound = useStore((s) => s.currentPlayer?.hasBoughtTerritoryThisRound);
  const canBuy = isMyTurn && !hasBoughtThisRound;

  if(territoryID == null) {return null}
  const economy = Object.entries(getTerritoryEconomy()).map((d)=>{
    return{
      type: d[0],
      ...d[1]
    }
  })
  console.log(economy)


  const buyBase = () => {
    if(!canBuy) return;
    buyTerritory(territoryID)
    setHasBase(true);
  }
  const sellBase = () => {
    if(!property){
      sellTerritory(territoryID)
      setHasBase(false)
    } 
  };
  const buyProperty = (type: string) => setProperty(type);
  const sellProperty = () => setProperty(null);

  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short'
  });

  const renderActionCell = (rowType: string, idx: number) => {
    const baseBtn = (label: string, onClick: () => void, destructive = false, disabled = false) => (
      <Button
        onClick={onClick}
        disabled={disabled}
        size="sm"
        variant={destructive ? "destructive" : "outline"}
        className="h-auto py-1 px-2 text-[clamp(10px,1vw,14px)] leading-none"
      >
        {label}
      </Button>
    );

    if (!hasBase) {
      if (rowType === "BASE") {
         return (
           <div className="flex flex-col gap-1 items-center justify-center">
             {baseBtn(`Buy Base for ${formatter.format(economy[0].capEx)}`, buyBase, false, !canBuy)}
             {!canBuy && (
                <span className="text-[10px] text-red-500 leading-tight">
                  {!isMyTurn ? "Not your turn" : "Limit 1 per round"}
                </span>
             )}
           </div>
         );
      }
      return null;
    }

    if (hasBase && !property) {
      if (rowType === "BASE") return baseBtn(`Sell Base for ${formatter.format(economy[0].capEx/2)}`, sellBase, true);
      return baseBtn(`Buy ${rowType} for ${formatter.format(economy[idx].capEx)}`, () => buyProperty(rowType));
    }

    if (property) {
      if (rowType === property) return baseBtn(`Sell ${property} for ${formatter.format(economy[idx].capEx/2)}`, sellProperty, true);
      return null;
    }

    return null;
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Table className="h-full flex-1 w-full overflow-hidden text-[clamp(10px,2vw,14px)]">
        <TableHeader>
          <TableRow>
            <TableHead className="border-r border-b border-gray-600 pr-1"></TableHead>
            <TableHead className="border-b border-gray-600">Initial Cost</TableHead>
            <TableHead className="border-b border-gray-600 wrap-break-word w-fit">Maintenance /<br/> round</TableHead>
            <TableHead className="border-b border-gray-600 wrap-break-word w-fit">income /<br/> round</TableHead>
            <TableHead className="border-b border-gray-600 wrap-break-word w-fit">TOC /<br/> round</TableHead>
            <TableHead className="border-b border-gray-600 text-center">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {economy.map((row, idx) => {
            const toc = row.revenue - row.opEx;
            console.log(row)
            return (
              <TableRow key={row.type}>
                <TableCell className="border-r py-1 border-gray-600 pr-1">{row.type}</TableCell>
                <TableCell className="py-1">{row.capEx}</TableCell>
                <TableCell className="py-1">{row.opEx}</TableCell>
                <TableCell className="py-1">{row.revenue}</TableCell>
                <TableCell className={`${toc < 0 ? "text-red-500" : "text-green-600"} py-1`}>
                  {(toc > 0) ? "+": ""}{toc}
                </TableCell>

                {/* Action cell */}
                <TableCell className="p-1 text-center">
                  {renderActionCell(row.type, idx)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


const TerritoryInfo = () => {
  return (
    <div className="h-full w-full px-2 text-white">
      <AssetManager />
    </div>
  );
};

export const TerritoryInfoDrawer = () => {
  const open = useInfoDrawerStore((state) => state.territoryInfoDrawerOpen);
  const setOpen = useInfoDrawerStore((state) => state.setTerritoryInfoDrawerOpen);

  return (
    <Drawer modal={false} disablePreventScroll={false} open={open} onOpenChange={setOpen} container={document.getElementById("action-area")}>
      <DrawerContent
        removeHandle
        onOpenAutoFocus={() => {
          document.body.style.pointerEvents = "auto";
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="bg-secondary absolute bottom-0 mx-2 h-full max-h-full rounded-t-xl! border shadow-lg"
      >
        <div className="relative h-full w-full pt-2 pb-2">
          {/* Visual Drag Handle (Default Shadcn Style) */}
          <div className="mx-auto hidden h-2 w-25 shrink-0 rounded-full bg-white/30 group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />

          {/* Explicit Close Button */}
          {/* <DrawerClose asChild>
            <X className={"absolute top-0 right-2 text-white/30"} size={30} />
          </DrawerClose> */}

          <TerritoryInfo />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
