import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/loaders/DRACOLoader.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.8.3/build/index.module.js';

const app = window.AtlasApp;
app.THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
app.THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
app.THREE.Mesh.prototype.raycast = acceleratedRaycast;
const frenchNames = {
  Cranium: 'Crâne', Skull: 'Crâne', Mandible: 'Mandibule', 'Body of sternum': 'Sternum',
  Sternum: 'Sternum', Femur: 'Fémur', Humerus: 'Humérus', Tibia: 'Tibia', Fibula: 'Fibula',
  Clavicle: 'Clavicule', Scapula: 'Scapula', Patella: 'Patella', Radius: 'Radius', Ulna: 'Ulna',
  'Hip bone': 'Os coxal', Pelvis: 'Bassin', Ribs: 'Côtes', Aorta: 'Aorte',
  'Abdominal aorta': 'Aorte abdominale', 'Ascending aorta': 'Aorte ascendante', Heart: 'Cœur',
  'Biceps brachii muscle': 'Biceps brachial', 'Deltoid muscle': 'Deltoïde',
  'Pectoralis major muscle': 'Grand pectoral', 'Rectus abdominis muscle': 'Grand droit de l’abdomen',
  'Quadriceps femoris muscle': 'Quadriceps fémoral', 'Femoral artery': 'Artère fémorale',
  'Femoral vein': 'Veine fémorale', 'Common carotid artery': 'Artère carotide commune',
  'Internal jugular vein': 'Veine jugulaire interne'
};

function regionOf(name, layer) {
  if (/head|skull|cranium|mandible|orbit|nasal|brain|cervical|jugular|carotid/i.test(name)) return /cervical|jugular|carotid/i.test(name) ? 'Cou et tête' : 'Tête';
  if (/thorac|rib|stern|lung|heart|aort|intercostal/i.test(name)) return 'Thorax';
  if (/abdomin|lumbar|renal|gastric|hepatic|mesenteric|pancreat/i.test(name)) return 'Abdomen';
  if (/pelv|iliac|sacral|gluteal|hip|femoral|thigh|leg|tibial|foot|femur|fibula|patella/i.test(name)) return 'Bassin et membre inférieur';
  if (/hand|wrist|radial|ulnar|humer|arm|brachial|clav|scapul|shoulder/i.test(name)) return 'Membre supérieur';
  return layer === 'bones' ? 'Squelette' : layer === 'muscles' ? 'Appareil locomoteur' : layer === 'veins' ? 'Réseau veineux' : 'Réseau artériel';
}

function layerOf(system, name) {
  if (system === 'skeletal') return 'bones';
  if (system === 'muscular') return 'muscles';
  return /\b(vein|venous|vena|venae|caval)\b/i.test(name) ? 'veins' : 'arteries';
}

function translateName(name) {
  const side = name.match(/\.(l|r)$/i)?.[1]?.toLowerCase();
  const base = name.replace(/\.(l|r)$/i, '').trim();
  let label = frenchNames[base];
  if (!label) {
    const terms = [
      [/femur/i, 'Fémur'], [/humerus/i, 'Humérus'], [/clavicle/i, 'Clavicule'], [/scapula/i, 'Scapula'],
      [/mandible/i, 'Mandibule'], [/sternum/i, 'Sternum'], [/rib/i, 'Côte'], [/vertebra/i, 'Vertèbre'],
      [/tibia/i, 'Tibia'], [/fibula/i, 'Fibula'], [/patella/i, 'Patella'], [/radius/i, 'Radius'], [/ulna/i, 'Ulna'],
      [/artery|arteria/i, 'Artère'], [/vein|vena|venous/i, 'Veine'], [/aorta/i, 'Aorte'],
      [/heart|atrium|ventricle/i, 'Cœur'], [/biceps/i, 'Biceps'], [/deltoid/i, 'Deltoïde'],
      [/pectoral/i, 'Pectoral'], [/quadriceps/i, 'Quadriceps']
    ];
    label = base;
    for (const [pattern, french] of terms) {
      if (pattern.test(base)) {
        const tail = base.replace(/^(left|right)\s*/i, '').replace(/(artery|arteria|vein|vena|aorta|heart|muscle|biceps|deltoid|pectoral|quadriceps|femur|humerus|tibia|fibula|patella|radius|ulna|clavicle|scapula|mandible|sternum|rib|vertebra)\s*/i, '').trim();
        label = french + (tail ? ' ' + tail : '');
        break;
      }
    }
  }
  return label + (side ? (side === 'l' ? ' gauche' : ' droit') : '');
}

function knownEntry(name) {
  const n = name.toLowerCase().replace(/\.(l|r)$/, '').trim();
  if (/^(cranium|skull|frontal bone|occipital bone)$/.test(n)) return 'skull';
  if (n === 'mandible') return 'mandible';
  if (n === 'clavicle') return 'clavicle';
  if (/sternum/.test(n)) return 'sternum';
  if (/\bfemur\b/.test(n)) return 'femur';
  if (/\bpatella\b/.test(n)) return 'patella';
  if (/\btibia\b|\bfibula\b/.test(n)) return 'tibia';
  if (/hip bone|pelvis/.test(n)) return 'pelvis';
  if (/rib/.test(n)) return 'ribs';
  if (/vertebral column|vertebra/.test(n)) return 'spine';
  if (/biceps brachii/.test(n)) return 'biceps';
  if (/deltoid muscle/.test(n)) return 'deltoid';
  if (/pectoralis major/.test(n)) return 'pectoral';
  if (/quadriceps femoris/.test(n)) return 'quad';
  if (/aorta/.test(n)) return 'aorta';
  if (/femoral artery/.test(n)) return 'femoralA';
  if (/carotid artery/.test(n)) return 'carotid';
  if (/femoral vein/.test(n)) return 'femoralV';
  if (/jugular vein/.test(n)) return 'jugular';
  if (/heart|atrium|ventricle/.test(n)) return 'heart';
  return null;
}

function record(name, system, layer, key) {
  const alias = knownEntry(name);
  const template = alias ? app.data[alias] : null;
  const latin = app.modelLexicon[name]?.la || app.modelLexicon['(' + name + ')']?.la || template?.latin || name;
  const definition = app.modelDefinitions[name] || app.modelDefinitions['(' + name + ')'] || '';
  const result = template
    ? { ...template, name: translateName(name), latin, layer, region: regionOf(name, layer), isModel: true, enName: name, key }
    : {
        name: translateName(name), latin,
        type: layer === 'bones' ? 'Os' : layer === 'muscles' ? 'Muscle' : layer === 'veins' ? 'Veine' : 'Artère',
        layer, region: regionOf(name, layer),
        description: 'Structure anatomique représentée dans le modèle 3D interactif.',
        function: 'Repère anatomique à replacer dans son système et sa région.',
        connections: '', fact: system === 'skeletal' ? 'Structure du squelette' : system === 'muscular' ? 'Structure musculaire ou fascia' : 'Vaisseau du système cardiovasculaire',
        note: 'La fiche reprend le nom anatomique et sa description de référence.',
        definition, definitionEnglish: !!definition, isModel: true, enName: name, key
      };
  if (definition) { result.definition = definition; result.definitionEnglish = true; }
  return result;
}

function loadGLB(loader, file) {
  return new Promise((resolve, reject) => loader.load('./models/' + file + '.glb', resolve, undefined, reject));
}

async function loadAtlas() {
  const veil = document.getElementById('modelLoading');
  veil.classList.add('show');
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  draco.preload();
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const systems = ['skeletal', 'muscular', 'cardiovascular'];
  try {
    const [models, definitions, lexicon] = await Promise.all([
      Promise.all(systems.map(id => loadGLB(loader, id))),
      fetch('./data/definitions.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('./data/lexicon.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]);
    Object.assign(app.modelDefinitions, definitions);
    Object.assign(app.modelLexicon, lexicon);
    Object.values(app.groups).forEach(group => group.clear());
    app.clickable.length = 0;
    app.dynamicData.clear();
    app.modelIndex.length = 0;

    models.forEach((gltf, index) => {
      const system = systems[index];
      const source = gltf.scene;
      source.updateMatrixWorld(true);
      for (const node of [...source.children]) {
        const name = node.userData?.za_name || node.name;
        if (!name) continue;
        const layer = layerOf(system, name);
        const key = 'za:' + system + ':' + name;
        const item = record(name, system, layer, key);
        app.groups[layer].attach(node);
        node.userData.structureKey = key;
        node.traverse(object => {
          if (!object.isMesh) return;
          object.userData.id = key;
          object.userData.layer = layer;
          object.userData.baseScale = object.scale.clone();
          if (object.geometry && !object.geometry.boundsTree) object.geometry.computeBoundsTree();
          app.clickable.push(object);
        });
        app.dynamicData.set(key, item);
        app.modelIndex.push({ key, name: item.name, enName: name, latin: item.latin, region: item.region, layer });
      }
    });

    Object.entries(app.groups).forEach(([layer, group]) => { group.visible = app.enabled[layer]; });
    app.root.updateMatrixWorld(true);
    const bounds = new app.THREE.Box3().setFromObject(app.root);
    const center = bounds.getCenter(new app.THREE.Vector3());
    const height = Math.max(bounds.max.y - bounds.min.y, 1.3);
    app.root.position.set(-center.x, -bounds.min.y, -center.z);
    const targetY = height * .52;
    const distance = Math.max(2.5, height * 2.1);
    app.controls.target.set(0, targetY, 0);
    app.camera.position.set(0, targetY, distance);
    app.camera.near = .03;
    app.camera.updateProjectionMatrix();
    app.controls.minDistance = Math.max(.45, height * .28);
    app.controls.maxDistance = height * 4;
    app.controls.saveState();
    app.controls.update();
    app.initialView = { targetY, distance };
    veil.classList.remove('show');
    document.getElementById('viewLabel').textContent = 'Vue antérieure · Corps entier';
    const skull = app.modelIndex.find(x => /cranium|skull/i.test(x.enName));
    if (skull) app.setSelected(skull.key);
    app.renderDetails();
    app.toast('Atlas 3D chargé · ' + app.modelIndex.length.toLocaleString('fr-FR') + ' structures disponibles');
  } catch (error) {
    console.error('Atlas anatomy load failed', error);
    veil.classList.remove('show');
    app.toast('Le modèle complet n’a pas pu se charger. Vérifiez la connexion.');
  }
}

loadAtlas();
