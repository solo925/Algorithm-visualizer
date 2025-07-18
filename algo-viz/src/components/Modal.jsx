import React from "react";
import { complexity } from "../constants";


function Modal({css,complexity,algorithm,setShowModal}){
    return(
        
        <div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div
              className="modal-content"
              style={{ background: css.modalBg, color: css.text }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Algorithm Cheat-Sheet</h2>
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Time</th>
                    <th>Space</th>
                    <th>Stable</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(complexity).map(([alg, data]) => (
                    <tr key={alg} className={alg === algorithm ? "current" : ""}>
                      <td>{alg[0].toUpperCase() + alg.slice(1)}</td>
                      <td>{data.time}</td>
                      <td>{data.space}</td>
                      <td>{data.stable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        
      </div>

    );
}
export default Modal;