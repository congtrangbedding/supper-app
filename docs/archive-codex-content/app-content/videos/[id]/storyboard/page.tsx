import { Storyboard } from "@/features/content/storyboard";
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <Storyboard key={id} id={id}/>;
}
