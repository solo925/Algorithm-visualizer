import { createContext, useContext } from "react";
import { useState } from "react";


const StatsContext = createContext();

export function StatsProvider({children}){
    const [stats,setStats] = useState({
        compares:0,
        swaps:0,
        reads:0,
        write:0,
    });
    return (
    <StatsContext.Provider value={{stats,setStats}}>
        {children}
    </StatsContext.Provider>
    );
}

export function useStats(){
    return useContext(StatsContext);
}