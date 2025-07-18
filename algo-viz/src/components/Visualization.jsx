import React from "react";

function Visualization({array,compared,pivot,css}){
    return(
         
      <div className="main">
      <div className="bars">
        {array?.map((h, idx) => (
          <div
            key={idx}
            className={`bar ${
              compared.includes(idx)
                ? "compare"
                : pivot.includes(idx)
                ? "pivot"
                : ""
            }`}
            style={{
              height: `${h}px`,
              background: compared.includes(idx)
                ? css.compare
                : pivot.includes(idx)
                ? css.pivot
                : css.bar
            }}
          />
        ))}
      </div>
      </div>
    )

}


export default Visualization;