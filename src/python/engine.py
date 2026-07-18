import sys
import json
from processor import convertir_a_pixel_art

def main():
    # Aseguramos que nos envian la ruta el ancho el alto y el booleano
    if len(sys.argv) < 5:
        return

    ruta_input = sys.argv[1]
    ancho = int(sys.argv[2])
    alto = int(sys.argv[3])
    mantener_original = sys.argv[4].lower() == 'true'

    # Pasamos las medidas separadas a la funcion matematica
    resultado = convertir_a_pixel_art(ruta_input, ancho, alto, mantener_original)
    
    print(json.dumps({"status": "ok", "path": resultado}))

if __name__ == "__main__":
    main()