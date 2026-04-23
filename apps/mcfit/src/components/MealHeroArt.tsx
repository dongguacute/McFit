/* 参考优惠页简笔插画：红盒、汉堡、纸杯，无品牌 Logo，仅为示意 */

export function MealHeroArt() {
  return (
    <div
      className="flex items-end justify-center gap-3 sm:gap-4"
      role="img"
      aria-label="餐品简笔示意：薯条、汉堡、饮料"
    >
      <div className="relative h-22 w-14 overflow-hidden rounded-lg bg-mcd-red shadow-sm sm:h-24 sm:w-16">
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5">
          <div className="h-1 w-3 rounded-t bg-mcd-gold" />
        </div>
        <div className="mx-auto mt-1 flex h-6 w-7 justify-center border-b-2 border-mcd-gold/90">
          <span className="text-[0.5rem] font-black leading-none text-mcd-gold">M</span>
        </div>
        <div className="mt-0.5 flex justify-center gap-0.5">
          <span className="h-1.5 w-1 rounded-sm bg-amber-200" />
          <span className="h-1.5 w-1 rounded-sm bg-amber-200" />
        </div>
      </div>

      <div className="flex h-20 w-24 flex-col items-center justify-end rounded-full border-[3px] border-amber-500/30 bg-amber-100/90 pb-1 shadow-sm sm:h-[5.2rem] sm:w-28">
        <div className="h-1.5 w-16 rounded-sm bg-amber-600/30" />
        <div className="mt-0.5 h-2.5 w-20 rounded-sm bg-amber-700/20" />
        <div className="mt-0.5 h-1.5 w-[4.2rem] rounded-sm bg-amber-600/30" />
        <div className="mt-0.5 h-1.5 w-16 rounded-b-md rounded-t-sm bg-amber-800/25" />
      </div>

      <div className="relative h-18 w-11 sm:h-[4.8rem] sm:w-12">
        <div className="absolute top-0 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-sm border border-neutral-200 bg-white" />
        <div className="absolute top-0.5 left-1.5 h-1 w-0.5 rounded bg-neutral-200" />
        <div className="absolute right-0 bottom-0 left-0 rounded-t-2xl rounded-b-sm border border-neutral-200/80 bg-white shadow-sm" style={{ height: "3.4rem" }}>
          <div className="mx-auto mt-2 flex w-4 justify-center border-b-2 border-mcd-gold/90">
            <span className="text-[0.4rem] font-black text-mcd-gold">M</span>
          </div>
        </div>
      </div>
    </div>
  );
}
