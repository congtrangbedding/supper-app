"use client";
import {useEffect,useState} from "react";
export function useClock(){
 const [now,set]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>set(Date.now()),500);return()=>clearInterval(timer);},[]);return now;
}
