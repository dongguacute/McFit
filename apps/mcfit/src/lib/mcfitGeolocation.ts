/**
 * 签到与首页共用：高精度、尽量不使用缓存，避免两次读坐标不一致导致「最近门店」偏差。
 */
export function getMcFitGeolocationPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("浏览器不支持定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20_000,
    });
  });
}
