import { categories, initialScenes, initialSlots, type Database, type Product } from "./model";
export function blankProduct():Product {
  return {id:"",name:"",sku:"",category:categories[0],description:"",brand:"An Nhiên",material:"",color:"",pattern:"",dimensions:"",facts:"",colors:"",sizes:"",photos:[],status:"Bản nháp"};
}
export function initialDatabase():Database {
  const rows=[
    ["cooling","Chiếu mát Mộc Hạ","MH-160","Sợi làm mát","Xanh sage","Chần ô vuông","160 × 200 cm"],
    ["bamboo","Chiếu tre Thanh Trúc","TT-180","Tre ép","Mật ong","Nan tre","180 × 200 cm"],
    ["blanket","Chăn cotton Đất Nung","DN-150","Cotton waffle","Đất nung","Dệt tổ ong","150 × 200 cm"],
    ["linen","Bộ ga linen Bình Minh","BM-160","Linen","Kem sữa","Trơn","160 × 200 cm"],
    ["pillow","Gối tựa Lam Khói","LK-045","Vải lanh","Xanh khói","Dệt thô","45 × 45 cm"],
    ["rug","Thảm dệt Cát Nhẹ","CN-120","Cotton dệt","Kem cát","Sọc ngang","120 × 180 cm"]
  ];
  const products=rows.map(([id,name,sku,material,color,pattern,dimensions],i)=>({...blankProduct(),id,name,sku,material,color,pattern,dimensions,category:categories[i],photos:["/content/"+id+".jpg"],description:name+" dành cho không gian sống hiện đại.",facts:material+" · "+dimensions,colors:color,sizes:dimensions,status:i===5?"Bản nháp":"Sẵn sàng"}));
  const templates:Database["templates"]=[
    ["editorial","Ấn bản tự nhiên","cooling","Biên tập"],["detail","Chất liệu cận cảnh","bamboo","Chi tiết"],["lifestyle","Nhịp sống ấm","linen","Lifestyle"],
    ["story","Chuyện chất liệu","blanket","Kể chuyện"],["showcase","Góc nhìn sản phẩm","pillow","Giới thiệu"],["motion","Không gian thường nhật","rug","Lifestyle"]
  ].map(([id,name,asset,category],i)=>({id,name,kind:i<3?"image":"video",category,format:i<3?"1:1 · 3:4":"9:16 · 16:9",description:["Bố cục thoáng với tiêu đề serif.","Nhấn vào họa tiết và bề mặt.","Đặt sản phẩm trong ngữ cảnh sử dụng."][i%3],cover:"/content/"+asset+".jpg"}));
  const images=products.slice(0,3).map((p,i)=>({id:"img-"+p.id,name:p.name+" · Bộ ảnh",productId:p.id,date:"2026-11-"+(18-i),status:i===1?"Chờ duyệt":"Bản nháp",template:templates[i].id,ratios:["1:1","3:4"],variant:p.color+" · "+p.dimensions,slots:initialSlots(p,templates[i].id),history:["Khởi tạo bộ ảnh mẫu"]}));
  const videos=products.slice(3,5).map((p,i)=>({id:"vid-"+p.id,name:p.name+" · Phim ngắn",productId:p.id,date:"2026-11-17",status:"Bản nháp",template:"story",ratio:"9:16",style:"Tự nhiên",avatar:"Chỉ sản phẩm",voice:"Giọng nữ",language:"Tiếng Việt",scenes:initialScenes(p,20+i*5)}));
  return {version:1,products,templates,images,videos,media:products.map(p=>({id:"media-"+p.id,name:p.name+".jpg",kind:"Ảnh",format:"JPEG",source:p.photos[0],cover:p.photos[0],dimensions:"512 × 512",bytes:42000,productId:p.id})),jobs:[{id:"sample-job",type:"Bộ ảnh",count:9,productId:"bamboo",template:"detail",status:"Lỗi",error:"Lỗi mô phỏng khi đọc mẫu. Có thể thử lại để xem tiến trình.",elapsed:6400,start:Date.parse("2026-11-18T09:00:00+07:00")}],approvals:[{id:"review-bamboo",projectId:"img-bamboo",kind:"image",productId:"bamboo",name:images[1].name,status:"Chờ duyệt",notes:""}],brand:{name:"An Nhiên",primary:"#284f3e",secondary:"#eee9d9",font:"Georgia"},ai:{preset:"Cân bằng",imageStyle:"Tự nhiên",videoStyle:"Điện ảnh"}};
}
