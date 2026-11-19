export const groups = [
  ["Tổng quan", [["dashboard","Bảng điều khiển"]]],
  ["Sản phẩm", [["products","Thư viện sản phẩm"],["products/new","Tạo sản phẩm"]]],
  ["Image Factory", [["images","Dự án ảnh"],["images/new","Tạo bộ ảnh"],["images/img-cooling/editor","Trình sửa ảnh"],["image-templates","Mẫu ảnh"]]],
  ["Video Factory", [["videos","Dự án video"],["videos/new","Tạo video AI"],["videos/vid-linen/storyboard","Bảng phân cảnh"],["video-templates","Mẫu video"]]],
  ["Sản xuất", [["media","Thư viện media"],["batch","Sản xuất hàng loạt"],["jobs","Công việc render"],["approvals","Trung tâm duyệt"]]],
  ["Cấu hình", [["settings/brand","Bộ nhận diện"],["settings/ai","Cấu hình AI"]]]
] as const;
export function studioTitle(path:string){
  const route=path.replace(/^\/content\/?/,"");
  for(const [,items] of groups)for(const [href,title] of items)if(href===route)return title;
  if(route.endsWith("/editor"))return "Trình sửa ảnh";
  if(route.endsWith("/storyboard"))return "Bảng phân cảnh";
  if(route.endsWith("/edit"))return "Sửa sản phẩm";
  if(route.startsWith("products/"))return "Chi tiết sản phẩm";
  return "AI Content Factory";
}
export const legacy:Record<string,string>={"content-factory":"dashboard","content-factory/products":"products","content-factory/image-studio":"images","content-factory/media":"media","content-factory/templates":"image-templates","content-factory/render-jobs":"jobs"};
