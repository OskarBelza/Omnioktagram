import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def center_and_resize_icon(image, target_size=(36, 36)):
    # Przekształć kanał alpha do maski
    if image.shape[2] == 4:  # RGBA
        alpha = image[:, :, 3]
    else:
        alpha = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Znajdź kontur nieprzezroczystych pikseli
    coords = cv2.findNonZero(alpha)
    if coords is None:
        return cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)

    x, y, w, h = cv2.boundingRect(coords)
    cropped = image[y:y+h, x:x+w]

    # Utwórz puste płótno i wyśrodkuj przycięty obraz
    result = np.zeros((target_size[1], target_size[0], 4), dtype=np.uint8)
    resized = cv2.resize(cropped, target_size, interpolation=cv2.INTER_AREA)

    h_, w_ = resized.shape[:2]
    offset_y = (target_size[1] - h_) // 2
    offset_x = (target_size[0] - w_) // 2
    result[offset_y:offset_y+h_, offset_x:offset_x+w_] = resized

    return result


def process_all_icons(input_dir, output_dir, size=(36, 36)):
    os.makedirs(output_dir, exist_ok=True)

    for v in range(8):
        filename = f"icon_{v}_0.png"
        path = os.path.join(input_dir, filename)
        if not os.path.exists(path):
            print(f"Brak: {filename}")
            continue

        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if img is None:
            print(f"Nieczytelny: {filename}")
            continue

        fixed = center_and_resize_icon(img, size)
        cv2.imwrite(os.path.join(output_dir, filename), fixed)


#process_all_icons("static/icons", "static/icons", size=(180, 180))

COLORS = {
    "czarny":      (0, 0, 0, 255),
    "żółty":       (255, 255, 0, 255),
    "czerwony":    (255, 0, 0, 255),
    "niebieski":   (0, 0, 255, 255),
    "zielony":     (0, 128, 0, 255),
    "turkusowy":   (64, 224, 208, 255),
    "magenta":     (255, 0, 255, 255),
    "jasny brązowy": (153, 76, 0, 255)
}


from PIL import Image, ImageDraw, ImageFont


def create_text_icon(text, font_path, font_size=36, text_color=(0, 0, 0, 255)):
    font = ImageFont.truetype(font_path, font_size)

    # Utwórz tymczasowy obraz i oblicz bounding box
    temp_image = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    draw = ImageDraw.Draw(temp_image)
    bbox = draw.textbbox((0, 0), text, font=font)

    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    padding = 4

    width = int(text_width + padding * 2)
    height = int(text_height + padding * 2)

    # Nowy obraz z przezroczystym tłem
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Pozycja z uwzględnieniem wysokości czcionki
    draw.text((padding - bbox[0], padding - bbox[1]), text, font=font, fill=text_color)

    return image


#labels = ["Losuj", "Przemiesc", "Zaatakuj", "Ulecz", "Obron", "Okryj", "Pokaz", "Zniszcz"]
#font_path = "static/fonts/Centurion.ttf"
#for idx in range(8):
#    icon = create_text_icon(f"{idx + 2}", font_path, text_color=COLORS["czarny"])
#    icon.save(f"static/icons/icon_{idx + 1}_7.png", format="PNG")

#for idx in range(4, 8):
#    old_name = f"static/icons/icon_8_{idx}.png"
#    new_name = f"static/icons/icon_0_{idx}.png"
#    os.rename(old_name, new_name)


def remove_icon_files(folder_path):
    for i in range(8):  # 0-7
        for j in range(2, 8):  # 2-7
            filename = f"icon_{i}_{j}.png"
            full_path = os.path.join(folder_path, filename)
            if os.path.isfile(full_path):
                os.remove(full_path)
                print(f"Usunięto: {filename}")
            else:
                print(f"Nie znaleziono: {filename}")

#remove_icon_files("static/icons")
