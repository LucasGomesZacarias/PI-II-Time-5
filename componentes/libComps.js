//<!-- Lucas Gomes Zacarias - RA 26003288 -->
// Primeiro Importe o seu componete aqui. 
import { NavBarComp } from "./navBar.js";
import { ListaDemandas } from"./listaDemandas.js";
import { FormDemandas } from './FormDemanda.js';

//De um nome a ele aqui ( NOME  )  (Referencie-o)
customElements.define('comp-navbar',NavBarComp);
customElements.define('lista-demandas', ListaDemandas);
customElements.define('form-demandas', FormDemandas);
