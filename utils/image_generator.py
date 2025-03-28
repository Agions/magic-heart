#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import math
import random
from pathlib import Path
import svgwrite
from cairosvg import svg2png
from PIL import Image, ImageDraw, ImageFilter

# 创建目录结构（如果不存在）
def ensure_directories():
    directories = [
        'images/magic_island',
        'images/magic_door',
        'images/buttons',
        'images/hexagons',
        'images/effects',
        'images/themes',
        'images/icons',
        'images/bg'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    return directories

# 生成魔法门图标
def generate_magic_door():
    # 创建SVG画布
    dwg = svgwrite.Drawing('images/magic_door/magic_door.svg', size=('120px', '140px'))
    
    # 添加渐变效果
    gradient = dwg.defs.add(dwg.linearGradient(
        id='doorGradient',
        x1='0%', y1='0%',
        x2='100%', y2='100%'
    ))
    gradient.add_stop_color(offset='0%', color='#FF6B6B')
    gradient.add_stop_color(offset='100%', color='#FF8E8E')
    
    # 创建魔法门轮廓（用路径创建门的形状）
    door_path = dwg.path(
        d='M60,10 C90,10 110,40 110,70 C110,100 90,130 60,130 C30,130 10,100 10,70 C10,40 30,10 60,10 Z',
        fill='url(#doorGradient)'
    )
    dwg.add(door_path)
    
    # 添加门把手
    door_handle = dwg.circle(center=(90, 70), r=8, fill='#FFFFFF', opacity=0.7)
    dwg.add(door_handle)
    
    # 添加魔法符文装饰
    for i in range(5):
        angle = 2 * math.pi * i / 5
        x = 60 + 40 * math.cos(angle)
        y = 70 + 40 * math.sin(angle)
        rune = dwg.circle(center=(x, y), r=4, fill='#FFFFFF', opacity=0.4)
        dwg.add(rune)
    
    # 添加光芒效果
    glow = dwg.filter(id='glow')
    glow.feGaussianBlur(in_='SourceGraphic', stdDeviation=2)
    door_glow = dwg.path(
        d='M60,15 C87,15 105,42 105,70 C105,98 87,125 60,125 C33,125 15,98 15,70 C15,42 33,15 60,15 Z',
        fill='none',
        stroke='#FFFFFF',
        stroke_width=2,
        filter='url(#glow)',
        opacity=0.5
    )
    dwg.add(door_glow)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/magic_door/magic_door.svg'
    png_path = 'images/magic_door/magic_door.png'
    svg2png(url=svg_path, write_to=png_path, output_width=240, output_height=280)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=240, output_height=280)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=360, output_height=420)
    
    print(f"魔法门图标已生成: {png_path}")

# 生成悬浮岛
def generate_floating_island():
    # 创建SVG画布
    dwg = svgwrite.Drawing('images/magic_island/floating_island.svg', size=('280px', '160px'))
    
    # 添加渐变背景
    gradient = dwg.defs.add(dwg.linearGradient(
        id='islandGradient',
        x1='0%', y1='0%',
        x2='100%', y2='100%'
    ))
    gradient.add_stop_color(offset='0%', color='#A8E6CF')
    gradient.add_stop_color(offset='100%', color='#DCEDC1')
    
    # 创建岛屿形状
    island_path = dwg.path(
        d='M30,80 C30,50 70,30 140,30 C210,30 250,50 250,80 C250,110 210,130 140,130 C70,130 30,110 30,80 Z',
        fill='url(#islandGradient)',
        stroke='#88D8B0',
        stroke_width=2
    )
    dwg.add(island_path)
    
    # 添加阴影
    shadow = dwg.filter(id='shadow')
    shadow.feGaussianBlur(in_='SourceAlpha', stdDeviation=3)
    shadow.feOffset(dx=0, dy=4)
    shadow.feComposite(in2='SourceAlpha', operator='arithmetic', k2=-1, k3=1)
    shadow.feColorMatrix(type='matrix', values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0')
    
    island_shadow = dwg.path(
        d='M40,85 C40,60 75,40 140,40 C205,40 240,60 240,85 C240,110 205,130 140,130 C75,130 40,110 40,85 Z',
        fill='none',
        filter='url(#shadow)'
    )
    dwg.add(island_shadow)
    
    # 添加装饰元素（小草、石头等）
    for i in range(8):
        x = random.randint(50, 230)
        y = random.randint(70, 110)
        size = random.randint(3, 6)
        grass = dwg.circle(center=(x, y), r=size, fill='#88D8B0')
        dwg.add(grass)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/magic_island/floating_island.svg'
    png_path = 'images/magic_island/floating_island.png'
    svg2png(url=svg_path, write_to=png_path, output_width=280, output_height=160)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=560, output_height=320)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=840, output_height=480)
    
    print(f"悬浮岛已生成: {png_path}")

# 生成功能按钮
def generate_function_buttons():
    button_names = ['settings', 'store', 'friends', 'tasks', 'help']
    button_colors = ['#FFD3B6', '#FFAAA5', '#A8E6CF', '#DCEDC1', '#FF8B94']
    
    for i, (name, color) in enumerate(zip(button_names, button_colors)):
        # 创建SVG画布
        dwg = svgwrite.Drawing(f'images/buttons/{name}.svg', size=('80px', '80px'))
        
        # 添加果冻效果的滤镜
        jelly_filter = dwg.filter(id='jellyFilter')
        jelly_filter.feGaussianBlur(in_='SourceGraphic', stdDeviation=2)
        jelly_filter.feColorMatrix(type='matrix', values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7')
        jelly_filter.feComposite(in2='SourceGraphic', operator='atop')
        
        # 创建按钮背景
        button_bg = dwg.circle(center=(40, 40), r=35, fill=color)
        dwg.add(button_bg)
        
        # 添加高光效果
        highlight = dwg.circle(center=(30, 30), r=15, fill='#FFFFFF', opacity=0.3)
        dwg.add(highlight)
        
        # 添加图标示意（简化为基本形状）
        if name == 'settings':
            # 齿轮图标
            gear = dwg.circle(center=(40, 40), r=15, fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(gear)
            for j in range(8):
                angle = 2 * math.pi * j / 8
                x1 = 40 + 15 * math.cos(angle)
                y1 = 40 + 15 * math.sin(angle)
                x2 = 40 + 22 * math.cos(angle)
                y2 = 40 + 22 * math.sin(angle)
                line = dwg.line(start=(x1, y1), end=(x2, y2), stroke='#FFFFFF', stroke_width=2)
                dwg.add(line)
        elif name == 'store':
            # 商店图标
            shop = dwg.rect(insert=(25, 30), size=(30, 20), fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(shop)
            roof = dwg.path(d='M20,30 L40,15 L60,30', fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(roof)
        elif name == 'friends':
            # 好友图标
            for j in range(2):
                person = dwg.circle(center=(30+j*20, 35), r=8, fill='#FFFFFF')
                dwg.add(person)
                body = dwg.path(d=f'M{30+j*20},43 L{30+j*20},55', fill='none', stroke='#FFFFFF', stroke_width=2)
                dwg.add(body)
        elif name == 'tasks':
            # 任务图标
            clipboard = dwg.rect(insert=(30, 25), size=(20, 30), fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(clipboard)
            for j in range(3):
                line = dwg.line(start=(35, 35+j*7), end=(45, 35+j*7), stroke='#FFFFFF', stroke_width=1)
                dwg.add(line)
        elif name == 'help':
            # 帮助图标
            question = dwg.text('?', insert=(35, 45), fill='#FFFFFF', font_size='24px', font_weight='bold')
            dwg.add(question)
            circle = dwg.circle(center=(40, 40), r=15, fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(circle)
        
        # 添加果冻效果
        jelly_overlay = dwg.circle(center=(40, 40), r=32, fill='none', stroke='#FFFFFF', 
                                  stroke_width=1, opacity=0.5, filter='url(#jellyFilter)')
        dwg.add(jelly_overlay)
        
        # 保存SVG
        dwg.save()
        
        # 转换为PNG（正常状态）
        svg_path = f'images/buttons/{name}.svg'
        png_path = f'images/buttons/{name}.png'
        svg2png(url=svg_path, write_to=png_path, output_width=80, output_height=80)
        
        # 创建按下状态PNG
        pressed_png = f'images/buttons/{name}_pressed.png'
        svg2png(url=svg_path, write_to=pressed_png, output_width=76, output_height=76)  # 稍微缩小表示按下状态
        
        # 创建禁用状态PNG
        svg_disabled = svgwrite.Drawing(f'images/buttons/{name}_disabled.svg', size=('80px', '80px'))
        button_disabled = svg_disabled.circle(center=(40, 40), r=35, fill='#CCCCCC')
        svg_disabled.add(button_disabled)
        svg_disabled.save()
        disabled_png = f'images/buttons/{name}_disabled.png'
        svg2png(url=f'images/buttons/{name}_disabled.svg', write_to=disabled_png, output_width=80, output_height=80)
        
        # 创建2x和3x版本
        svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=160, output_height=160)
        svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=240, output_height=240)
        
        print(f"{name}按钮已生成: {png_path}")

# 生成六边形方块
def generate_hexagons():
    colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#073B4C']
    
    for i, color in enumerate(colors):
        # 创建SVG画布
        dwg = svgwrite.Drawing(f'images/hexagons/hex_{i+1}.svg', size=('80px', '80px'))
        
        # 添加六边形
        points = []
        for j in range(6):
            angle = 2 * math.pi / 6 * j - math.pi / 6
            x = 40 + 35 * math.cos(angle)
            y = 40 + 35 * math.sin(angle)
            points.append((x, y))
        
        hexagon = dwg.polygon(points=points, fill=color, stroke='#FFFFFF', stroke_width=1)
        dwg.add(hexagon)
        
        # 添加高光效果
        gradient = dwg.defs.add(dwg.linearGradient(
            id=f'hexGradient{i}',
            x1='0%', y1='0%',
            x2='100%', y2='100%'
        ))
        gradient.add_stop_color(offset='0%', color='#FFFFFF', opacity=0.3)
        gradient.add_stop_color(offset='100%', color=color, opacity=0.1)
        
        hexagon_overlay = dwg.polygon(points=points, fill=f'url(#hexGradient{i})')
        dwg.add(hexagon_overlay)
        
        # 保存SVG
        dwg.save()
        
        # 转换为PNG
        svg_path = f'images/hexagons/hex_{i+1}.svg'
        png_path = f'images/hexagons/hex_{i+1}.png'
        svg2png(url=svg_path, write_to=png_path, output_width=80, output_height=80)
        
        # 创建消除效果的PNG
        glow_svg = svgwrite.Drawing(f'images/hexagons/hex_{i+1}_glow.svg', size=('120px', '120px'))
        
        # 添加发光滤镜
        glow_filter = glow_svg.filter(id='glowEffect')
        glow_filter.feGaussianBlur(in_='SourceGraphic', stdDeviation=3)
        glow_filter.feComposite(in2='SourceGraphic', operator='over')
        
        # 扩大的六边形（1.5倍）
        glow_points = []
        for j in range(6):
            angle = 2 * math.pi / 6 * j - math.pi / 6
            x = 60 + 52 * math.cos(angle)
            y = 60 + 52 * math.sin(angle)
            glow_points.append((x, y))
            
        glow_hex = glow_svg.polygon(points=glow_points, fill=color, filter='url(#glowEffect)')
        glow_svg.add(glow_hex)
        
        # 保存发光SVG
        glow_svg.save()
        
        # 转换为发光PNG
        glow_png_path = f'images/hexagons/hex_{i+1}_glow.png'
        svg2png(url=f'images/hexagons/hex_{i+1}_glow.svg', write_to=glow_png_path, output_width=120, output_height=120)
        
        # 创建2x和3x版本
        svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=160, output_height=160)
        svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=240, output_height=240)
        
        print(f"六边形方块{i+1}已生成: {png_path}")

# 生成光效
def generate_effects():
    # 创建消除光效
    dwg = svgwrite.Drawing('images/effects/clear_effect.svg', size=('120px', '120px'))
    
    # 添加放射性渐变
    radial = dwg.defs.add(dwg.radialGradient(
        id='radialGlow',
        cx='50%', cy='50%', r='50%',
        fx='50%', fy='50%'
    ))
    radial.add_stop_color(offset='0%', color='#FFFFFF')
    radial.add_stop_color(offset='70%', color='#FFFFFF', opacity=0.3)
    radial.add_stop_color(offset='100%', color='#FFFFFF', opacity=0)
    
    # 光效圆
    glow_circle = dwg.circle(center=(60, 60), r=55, fill='url(#radialGlow)')
    dwg.add(glow_circle)
    
    # 添加星形光芒
    for i in range(8):
        angle = 2 * math.pi * i / 8
        x1 = 60 + 30 * math.cos(angle)
        y1 = 60 + 30 * math.sin(angle)
        x2 = 60 + 55 * math.cos(angle)
        y2 = 60 + 55 * math.sin(angle)
        ray = dwg.line(start=(x1, y1), end=(x2, y2), stroke='#FFFFFF', stroke_width=3, opacity=0.6)
        dwg.add(ray)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/effects/clear_effect.svg'
    png_path = 'images/effects/clear_effect.png'
    svg2png(url=svg_path, write_to=png_path, output_width=120, output_height=120)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=240, output_height=240)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=360, output_height=360)
    
    print(f"消除光效已生成: {png_path}")
    
    # 创建能量槽
    dwg_energy = svgwrite.Drawing('images/effects/energy_bar.svg', size=('300px', '40px'))
    
    # 添加能量槽背景
    energy_bg = dwg_energy.rect(insert=(0, 0), size=(300, 40), rx=20, ry=20, fill='#073B4C', opacity=0.3)
    dwg_energy.add(energy_bg)
    
    # 添加能量槽填充
    energy_fill = dwg_energy.rect(insert=(5, 5), size=(200, 30), rx=15, ry=15, fill='#06D6A0')
    dwg_energy.add(energy_fill)
    
    # 添加光泽效果
    gloss = dwg_energy.rect(insert=(5, 5), size=(200, 15), rx=15, ry=15, fill='#FFFFFF', opacity=0.3)
    dwg_energy.add(gloss)
    
    # 保存SVG
    dwg_energy.save()
    
    # 转换为PNG
    energy_svg_path = 'images/effects/energy_bar.svg'
    energy_png_path = 'images/effects/energy_bar.png'
    svg2png(url=energy_svg_path, write_to=energy_png_path, output_width=300, output_height=40)
    
    # 创建2x和3x版本
    svg2png(url=energy_svg_path, write_to=energy_png_path.replace('.png', '@2x.png'), output_width=600, output_height=80)
    svg2png(url=energy_svg_path, write_to=energy_png_path.replace('.png', '@3x.png'), output_width=900, output_height=120)
    
    print(f"能量槽已生成: {energy_png_path}")

# 生成主题切换器
def generate_theme_switcher():
    # 创建SVG画布
    dwg = svgwrite.Drawing('images/themes/theme_switcher.svg', size=('200px', '60px'))
    
    # 添加主题切换器背景
    switcher_bg = dwg.rect(insert=(0, 0), size=(200, 60), rx=30, ry=30, fill='#073B4C', opacity=0.2)
    dwg.add(switcher_bg)
    
    # 添加三个主题选项
    theme_colors = ['#FF6B6B', '#06D6A0', '#118AB2']
    
    for i, color in enumerate(theme_colors):
        x = 40 + i * 60
        theme_option = dwg.circle(center=(x, 30), r=20, fill=color)
        dwg.add(theme_option)
        
        # 为选中的主题添加边框（默认选择第一个主题）
        if i == 0:
            selected = dwg.circle(center=(x, 30), r=24, fill='none', stroke='#FFFFFF', stroke_width=2)
            dwg.add(selected)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/themes/theme_switcher.svg'
    png_path = 'images/themes/theme_switcher.png'
    svg2png(url=svg_path, write_to=png_path, output_width=200, output_height=60)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=400, output_height=120)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=600, output_height=180)
    
    print(f"主题切换器已生成: {png_path}")
    
    # 为每个主题创建主题预览图
    for i, color in enumerate(theme_colors):
        theme_name = ['red', 'green', 'blue'][i]
        
        # 创建主题预览SVG
        theme_dwg = svgwrite.Drawing(f'images/themes/theme_{theme_name}.svg', size=('200px', '200px'))
        
        # 添加背景
        theme_bg = theme_dwg.rect(insert=(0, 0), size=(200, 200), fill=color, opacity=0.2)
        theme_dwg.add(theme_bg)
        
        # 添加示例UI元素
        ui_rect = theme_dwg.rect(insert=(20, 20), size=(160, 60), rx=10, ry=10, fill=color, opacity=0.5)
        theme_dwg.add(ui_rect)
        
        ui_circle = theme_dwg.circle(center=(100, 120), r=30, fill=color)
        theme_dwg.add(ui_circle)
        
        # 保存SVG
        theme_dwg.save()
        
        # 转换为PNG
        theme_svg_path = f'images/themes/theme_{theme_name}.svg'
        theme_png_path = f'images/themes/theme_{theme_name}.png'
        svg2png(url=theme_svg_path, write_to=theme_png_path, output_width=200, output_height=200)
        
        print(f"主题{theme_name}已生成: {theme_png_path}")

# 生成指南针图标
def generate_compass_icon():
    # 创建SVG画布
    dwg = svgwrite.Drawing('images/icons/compass.svg', size=('64px', '64px'))
    
    # 添加圆形背景
    circle = dwg.circle(center=(32, 32), r=30, fill='#FFFFFF', stroke='#073B4C', stroke_width=2)
    dwg.add(circle)
    
    # 添加指南针指针
    north = dwg.path(d='M32,10 L36,32 L32,54 L28,32 Z', fill='#FF6B6B')
    dwg.add(north)
    
    # 添加指南针刻度
    for i in range(8):
        angle = 2 * math.pi * i / 8
        x1 = 32 + 24 * math.cos(angle)
        y1 = 32 + 24 * math.sin(angle)
        x2 = 32 + 30 * math.cos(angle)
        y2 = 32 + 30 * math.sin(angle)
        tick = dwg.line(start=(x1, y1), end=(x2, y2), stroke='#073B4C', stroke_width=1)
        dwg.add(tick)
    
    # 添加中心点
    center_dot = dwg.circle(center=(32, 32), r=3, fill='#073B4C')
    dwg.add(center_dot)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/icons/compass.svg'
    png_path = 'images/icons/compass.png'
    svg2png(url=svg_path, write_to=png_path, output_width=64, output_height=64)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=128, output_height=128)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=192, output_height=192)
    
    print(f"指南针图标已生成: {png_path}")

# 生成背景图片
def generate_background():
    # 创建SVG画布
    dwg = svgwrite.Drawing('images/bg/main_bg.svg', size=('750px', '1334px'))
    
    # 添加渐变背景
    gradient = dwg.defs.add(dwg.linearGradient(
        id='bgGradient',
        x1='0%', y1='0%',
        x2='100%', y2='100%'
    ))
    gradient.add_stop_color(offset='0%', color='#F9FAFC')
    gradient.add_stop_color(offset='100%', color='#E6F2FF')
    
    # 创建背景矩形
    bg_rect = dwg.rect(insert=(0, 0), size=('100%', '100%'), fill='url(#bgGradient)')
    dwg.add(bg_rect)
    
    # 添加装饰元素 - 魔法粒子
    for i in range(50):
        x = random.randint(10, 740)
        y = random.randint(10, 1324)
        size = random.randint(1, 4)
        opacity = random.uniform(0.1, 0.5)
        particle = dwg.circle(center=(x, y), r=size, fill='#B088F9', opacity=opacity)
        dwg.add(particle)
    
    # 添加魔法图案 - 魔法环
    for i in range(5):
        x = random.randint(100, 650)
        y = random.randint(100, 1200)
        size = random.randint(50, 150)
        ring = dwg.circle(center=(x, y), r=size, fill='none', 
                         stroke='#A8E6CF', stroke_width=1, opacity=0.2)
        dwg.add(ring)
    
    # 保存SVG
    dwg.save()
    
    # 转换为PNG
    svg_path = 'images/bg/main_bg.svg'
    png_path = 'images/bg/main_bg.png'
    svg2png(url=svg_path, write_to=png_path, output_width=750, output_height=1334)
    
    # 创建2x和3x版本
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@2x.png'), output_width=1500, output_height=2668)
    svg2png(url=svg_path, write_to=png_path.replace('.png', '@3x.png'), output_width=2250, output_height=4002)
    
    print(f"背景图片已生成: {png_path}")

# 主函数
def main():
    # 确保目录存在
    ensure_directories()
    
    # 生成各种图像资源
    generate_magic_door()
    generate_floating_island()
    generate_function_buttons()
    generate_hexagons()
    generate_effects()
    generate_theme_switcher()
    generate_compass_icon()
    generate_background()  # 添加生成背景图片
    
    print("所有图像资源生成完成!")

if __name__ == "__main__":
    main() 