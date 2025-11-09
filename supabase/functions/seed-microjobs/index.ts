import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema - currently no required parameters, but prepared for future auth
const requestSchema = z.object({
  sessionToken: z.string().uuid("Invalid session token format").optional(),
}).optional();

interface MicroJob {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  reward_credits: number;
  estimated_co2_kg_impact: number;
  location: string;
  is_active: boolean;
}

const SEED_JOBS: MicroJob[] = [
  // Tree Planting (20 jobs)
  { title: "Plant native oak saplings in community forest", description: "Help restore local biodiversity by planting 15-20 young oak trees. Basic tools and saplings provided. No experience needed.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 45, estimated_co2_kg_impact: 65, location: "Rural valley, Southern Serbia", is_active: true },
  { title: "Establish fruit tree orchard for local cooperative", description: "Plant apple and pear trees for a community food project. Learn proper spacing and care techniques.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 60, estimated_co2_kg_impact: 70, location: "Peri-urban district, Northern Italy", is_active: true },
  { title: "Reforest mountain slope after wildfire", description: "Challenging terrain planting work restoring native pine and fir species. Physical fitness required.", category: "tree_planting", difficulty_level: "Advanced", estimated_duration_minutes: 180, reward_credits: 100, estimated_co2_kg_impact: 80, location: "Rural mountainous area, Northern Albania", is_active: true },
  { title: "Plant native trees along riverbank", description: "Help prevent erosion by planting willow and alder along a local river. Rubber boots recommended.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 40, estimated_co2_kg_impact: 55, location: "Coastal town, Adriatic coast, Croatia", is_active: true },
  { title: "Create urban green corridor with street trees", description: "Plant ornamental and shade trees in city neighborhoods to reduce heat island effect.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 35, estimated_co2_kg_impact: 45, location: "Low-income urban district, Western Germany", is_active: true },
  { title: "Install tree guards and mulch for new plantings", description: "Protect young trees from deer and drought by installing guards and wood chip mulch.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 45, reward_credits: 25, estimated_co2_kg_impact: 20, location: "Rural valley, Southern Serbia", is_active: true },
  { title: "Plant windbreak trees for agricultural protection", description: "Establish rows of fast-growing poplars to shelter crops from strong winds.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 75, estimated_co2_kg_impact: 68, location: "Agricultural region, Central Romania", is_active: true },
  { title: "Restore ancient olive grove with new saplings", description: "Revitalize traditional olive cultivation by planting disease-resistant varieties.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 65, estimated_co2_kg_impact: 50, location: "Island community, Aegean Sea, Greece", is_active: true },
  { title: "Plant native chestnuts for food forestry", description: "Create a productive forest ecosystem with edible chestnuts that support local wildlife.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 135, reward_credits: 70, estimated_co2_kg_impact: 62, location: "Mountainous region, Northern Spain", is_active: true },
  { title: "Install tree seedlings in degraded mining area", description: "Ecological restoration work planting pioneer species in challenging contaminated soil.", category: "tree_planting", difficulty_level: "Advanced", estimated_duration_minutes: 180, reward_credits: 110, estimated_co2_kg_impact: 75, location: "Former industrial zone, Eastern Poland", is_active: true },
  { title: "Create schoolyard micro-forest with students", description: "Educational tree planting project establishing a tiny native woodland on school grounds.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 50, estimated_co2_kg_impact: 48, location: "Suburban neighborhood, Budapest, Hungary", is_active: true },
  { title: "Plant riparian buffer zone for water quality", description: "Establish trees and shrubs along stream to filter agricultural runoff and prevent erosion.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 80, estimated_co2_kg_impact: 65, location: "Agricultural watershed, Southern France", is_active: true },
  { title: "Restore coastal dune vegetation with native shrubs", description: "Stabilize sandy shoreline by planting salt-tolerant native species.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 42, estimated_co2_kg_impact: 35, location: "Coastal dunes, Northern Netherlands", is_active: true },
  { title: "Plant heritage fruit tree varieties in village", description: "Preserve local biodiversity by establishing old regional apple and plum cultivars.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 48, estimated_co2_kg_impact: 52, location: "Rural village, Western Bulgaria", is_active: true },
  { title: "Establish native woodland for carbon sequestration", description: "Large-scale climate mitigation planting with mixed native broadleaf species.", category: "tree_planting", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 95, estimated_co2_kg_impact: 78, location: "Rural lowland, Southern Sweden", is_active: true },
  { title: "Plant street trees in heat-vulnerable neighborhood", description: "Combat urban heat island by installing shade trees along sidewalks.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 38, estimated_co2_kg_impact: 40, location: "Inner city district, Vienna, Austria", is_active: true },
  { title: "Create pollinator-friendly hedgerow with native trees", description: "Plant mixed hedge of hawthorn, blackthorn and hazel to support insects and birds.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 105, reward_credits: 55, estimated_co2_kg_impact: 45, location: "Farmland boundary, Southern Ireland", is_active: true },
  { title: "Reforest abandoned agricultural terraces", description: "Restore steep hillside by planting native trees on historic stone terraces.", category: "tree_planting", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 120, estimated_co2_kg_impact: 72, location: "Mountainous terrain, Northern Portugal", is_active: true },
  { title: "Plant climate-adapted tree species trial plots", description: "Scientific forestry project testing drought-resistant species for future climate conditions.", category: "tree_planting", difficulty_level: "Advanced", estimated_duration_minutes: 165, reward_credits: 90, estimated_co2_kg_impact: 60, location: "Research station, Southern Czech Republic", is_active: true },
  { title: "Install young trees in community park renovation", description: "Beautify neighborhood green space with diverse ornamental and native tree species.", category: "tree_planting", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 40, estimated_co2_kg_impact: 38, location: "Urban park, Tirana, Albania", is_active: true },

  // Water Harvesting (20 jobs)
  { title: "Install basic rainwater collection barrels", description: "Mount gutters and downspout diverters to capture roof runoff for garden irrigation.", category: "water_harvesting", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 30, estimated_co2_kg_impact: 12, location: "Residential neighborhood, Athens, Greece", is_active: true },
  { title: "Build community rainwater harvesting cistern", description: "Construct large storage tank for neighborhood garden watering during dry months.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 85, estimated_co2_kg_impact: 25, location: "Rural village, Southern Spain", is_active: true },
  { title: "Install permeable paving for groundwater recharge", description: "Replace impervious surfaces with porous materials to reduce runoff and replenish aquifers.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 130, estimated_co2_kg_impact: 18, location: "Urban plaza, Ljubljana, Slovenia", is_active: true },
  { title: "Create swale system for agricultural water retention", description: "Dig contour trenches to slow water flow and allow infiltration on farmland.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 75, estimated_co2_kg_impact: 22, location: "Sloped farmland, Southern Italy", is_active: true },
  { title: "Install rooftop water collection for school building", description: "Set up gutters and storage tanks to provide water for school gardens and toilets.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 65, estimated_co2_kg_impact: 20, location: "Rural school, Western Romania", is_active: true },
  { title: "Build small check dams in eroding gully", description: "Construct rock barriers to slow water flow, prevent erosion and encourage infiltration.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 110, estimated_co2_kg_impact: 28, location: "Degraded landscape, Central Bulgaria", is_active: true },
  { title: "Install first-flush diverter for rainwater system", description: "Add device to filter initial dirty roof runoff before it enters storage tank.", category: "water_harvesting", difficulty_level: "Beginner", estimated_duration_minutes: 45, reward_credits: 25, estimated_co2_kg_impact: 8, location: "Suburban home, Northern Germany", is_active: true },
  { title: "Create bioswale for stormwater management", description: "Landscape planted depression to capture and filter urban runoff naturally.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 90, estimated_co2_kg_impact: 24, location: "Parking area, Copenhagen, Denmark", is_active: true },
  { title: "Install fog harvesting nets in mountain village", description: "Set up mesh screens to collect water from mist and clouds in water-scarce region.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 165, reward_credits: 95, estimated_co2_kg_impact: 15, location: "Mountain village, Canary Islands, Spain", is_active: true },
  { title: "Build pond for agricultural water storage", description: "Excavate and line small reservoir to store winter rainfall for summer irrigation.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 140, estimated_co2_kg_impact: 35, location: "Farm property, Southern France", is_active: true },
  { title: "Install grey water recycling system in community center", description: "Redirect sink and shower water to toilets and outdoor irrigation.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 180, reward_credits: 100, estimated_co2_kg_impact: 26, location: "Community building, Barcelona, Spain", is_active: true },
  { title: "Create rain garden to capture driveway runoff", description: "Dig shallow planted basin to absorb water from paved surfaces and reduce flooding.", category: "water_harvesting", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 40, estimated_co2_kg_impact: 14, location: "Residential area, Zagreb, Croatia", is_active: true },
  { title: "Install underground water storage tank", description: "Bury large cistern to maximize rainwater collection without using above-ground space.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 115, estimated_co2_kg_impact: 30, location: "Urban property, Milan, Italy", is_active: true },
  { title: "Build keyline water distribution system on farm", description: "Create contour channels to spread water evenly across landscape following topography.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 135, estimated_co2_kg_impact: 32, location: "Agricultural land, Central Portugal", is_active: true },
  { title: "Install downspout disconnection for infiltration", description: "Redirect roof drains away from sewers into planted areas for groundwater recharge.", category: "water_harvesting", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 32, estimated_co2_kg_impact: 10, location: "Urban neighborhood, Brussels, Belgium", is_active: true },
  { title: "Create infiltration basin for parking lot runoff", description: "Construct vegetated depression to capture and absorb stormwater from paved area.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 78, estimated_co2_kg_impact: 20, location: "Commercial zone, Warsaw, Poland", is_active: true },
  { title: "Install rooftop drip irrigation from collected rain", description: "Set up efficient watering system powered by gravity-fed rainwater tanks.", category: "water_harvesting", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 68, estimated_co2_kg_impact: 16, location: "Greenhouse facility, Southern Netherlands", is_active: true },
  { title: "Build dry stone terrace walls for water retention", description: "Construct traditional agricultural terracing to slow runoff and hold moisture.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 125, estimated_co2_kg_impact: 22, location: "Hillside farm, Northern Greece", is_active: true },
  { title: "Install sand dam for shallow groundwater storage", description: "Build low barrier in seasonal stream bed to trap sand and create underground water reserve.", category: "water_harvesting", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 120, estimated_co2_kg_impact: 28, location: "Dry valley, Southern Cyprus", is_active: true },
  { title: "Create micro-catchment basins around fruit trees", description: "Dig small circular trenches to concentrate rainfall at tree roots.", category: "water_harvesting", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 45, estimated_co2_kg_impact: 12, location: "Orchard, Central Turkey", is_active: true },

  // Solar Maintenance (20 jobs)
  { title: "Clean residential rooftop solar panels", description: "Remove dust, pollen and debris from photovoltaic array to restore peak efficiency.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 45, reward_credits: 28, estimated_co2_kg_impact: 8, location: "Suburban home, Athens, Greece", is_active: true },
  { title: "Inspect solar array electrical connections", description: "Check wiring, junction boxes and inverter for corrosion, loose terminals and safety issues.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 90, reward_credits: 55, estimated_co2_kg_impact: 12, location: "Commercial building, Berlin, Germany", is_active: true },
  { title: "Replace damaged solar panel in community installation", description: "Remove cracked module and install replacement unit. Electrical knowledge required.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 150, reward_credits: 95, estimated_co2_kg_impact: 15, location: "Community center, Barcelona, Spain", is_active: true },
  { title: "Trim tree branches shading solar panels", description: "Prune overhanging vegetation to maximize sunlight exposure and system output.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 32, estimated_co2_kg_impact: 6, location: "Rural property, Southern France", is_active: true },
  { title: "Monitor and log solar system performance data", description: "Record inverter readings and compare to expected output to identify problems.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 30, reward_credits: 20, estimated_co2_kg_impact: 5, location: "Solar farm, Southern Spain", is_active: true },
  { title: "Clean and inspect solar hot water collectors", description: "Wash glazing, check for leaks, and verify circulation pump operation.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 75, reward_credits: 48, estimated_co2_kg_impact: 10, location: "Apartment block, Vienna, Austria", is_active: true },
  { title: "Test solar battery storage system capacity", description: "Perform charge/discharge cycles and check battery health indicators.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 120, reward_credits: 75, estimated_co2_kg_impact: 14, location: "Off-grid home, Northern Sweden", is_active: true },
  { title: "Replace failed solar inverter unit", description: "Diagnose inverter failure, disconnect old unit and install replacement. Licensed electrician work.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 180, reward_credits: 110, estimated_co2_kg_impact: 18, location: "Industrial facility, Northern Italy", is_active: true },
  { title: "Clean dust and bird droppings from large array", description: "Wash extensive commercial rooftop installation using soft brushes and deionized water.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 120, reward_credits: 62, estimated_co2_kg_impact: 16, location: "Warehouse, Rotterdam, Netherlands", is_active: true },
  { title: "Inspect and tighten solar panel mounting hardware", description: "Check all bolts, rails and clamps for wind damage and corrosion. Prevent panel loss.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 90, reward_credits: 52, estimated_co2_kg_impact: 8, location: "Coastal installation, Portugal", is_active: true },
  { title: "Calibrate solar tracking system controllers", description: "Adjust sensors and motors so panels follow sun accurately throughout day.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 120, reward_credits: 80, estimated_co2_kg_impact: 20, location: "Solar farm, Southern Romania", is_active: true },
  { title: "Apply anti-soiling coating to solar panels", description: "Treat panel surfaces with hydrophobic coating to reduce dust adhesion.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 105, reward_credits: 65, estimated_co2_kg_impact: 12, location: "Desert-edge installation, Southern Cyprus", is_active: true },
  { title: "Inspect grounding system for lightning protection", description: "Test earth connections and check grounding rods for solar array safety.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 75, reward_credits: 58, estimated_co2_kg_impact: 6, location: "Exposed hilltop array, Scotland", is_active: true },
  { title: "Clean inverter ventilation fans and filters", description: "Remove dust buildup from cooling systems to prevent overheating failures.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 45, reward_credits: 28, estimated_co2_kg_impact: 7, location: "Solar installation, Czech Republic", is_active: true },
  { title: "Document solar panel condition with thermal imaging", description: "Use infrared camera to identify hot spots and failing cells requiring attention.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 135, reward_credits: 88, estimated_co2_kg_impact: 15, location: "Large array, Southern Germany", is_active: true },
  { title: "Replace corroded MC4 connectors on panels", description: "Swap out weathered plug connections to restore electrical continuity.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 90, reward_credits: 55, estimated_co2_kg_impact: 8, location: "Rooftop system, Dublin, Ireland", is_active: true },
  { title: "Pressure wash solar thermal collectors", description: "Deep clean solar hot water panels to maximize heat absorption efficiency.", category: "solar_maintenance", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 35, estimated_co2_kg_impact: 9, location: "Hotel facility, Greek islands", is_active: true },
  { title: "Upgrade solar monitoring system software", description: "Install firmware updates and configure remote monitoring capabilities.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 75, reward_credits: 50, estimated_co2_kg_impact: 5, location: "Municipal building, Oslo, Norway", is_active: true },
  { title: "Seal roof penetrations around solar mounts", description: "Apply weatherproofing to prevent leaks at panel mounting points.", category: "solar_maintenance", difficulty_level: "Intermediate", estimated_duration_minutes: 105, reward_credits: 62, estimated_co2_kg_impact: 7, location: "Commercial building, Lyon, France", is_active: true },
  { title: "Test solar disconnect switches and safety systems", description: "Verify all emergency shutoff equipment functions correctly for firefighter safety.", category: "solar_maintenance", difficulty_level: "Advanced", estimated_duration_minutes: 90, reward_credits: 68, estimated_co2_kg_impact: 6, location: "Hospital installation, Poland", is_active: true },

  // Agroforestry (20 jobs)
  { title: "Support farmers with alley-cropping agroforestry", description: "Plant rows of nitrogen-fixing trees between crop fields to improve soil and provide windbreaks.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 90, estimated_co2_kg_impact: 55, location: "Agricultural valley, Southern Serbia", is_active: true },
  { title: "Establish silvopasture system with fruit trees", description: "Integrate apple and pear trees into grazing land for livestock shade and diversified farm income.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 80, estimated_co2_kg_impact: 48, location: "Pastoral farm, Northern Spain", is_active: true },
  { title: "Plant nitrogen-fixing trees in coffee plantation", description: "Introduce shade trees that improve soil fertility and coffee quality while sequestering carbon.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 70, estimated_co2_kg_impact: 42, location: "Mountain farm, Canary Islands", is_active: true },
  { title: "Create forest garden with multiple canopy layers", description: "Design productive ecosystem combining fruit trees, berry bushes and edible ground covers.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 115, estimated_co2_kg_impact: 60, location: "Permaculture site, Southern France", is_active: true },
  { title: "Install living fences with native hedge species", description: "Plant thorny shrubs and small trees as natural barriers replacing barbed wire.", category: "agroforestry", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 50, estimated_co2_kg_impact: 32, location: "Ranch boundary, Central Portugal", is_active: true },
  { title: "Establish riparian buffer with productive trees", description: "Plant nut and fruit trees along creek to protect water while providing food.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 150, reward_credits: 82, estimated_co2_kg_impact: 52, location: "Farmland stream, Northern Italy", is_active: true },
  { title: "Integrate beehives into orchard agroforestry system", description: "Set up apiaries within fruit tree systems for pollination services and honey production.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 105, reward_credits: 65, estimated_co2_kg_impact: 25, location: "Orchard farm, Greece", is_active: true },
  { title: "Plant multi-purpose trees on farm boundaries", description: "Establish perimeter plantings providing timber, fodder, and wildlife habitat.", category: "agroforestry", difficulty_level: "Beginner", estimated_duration_minutes: 120, reward_credits: 60, estimated_co2_kg_impact: 45, location: "Family farm, Bulgaria", is_active: true },
  { title: "Create dehesa-style oak savanna system", description: "Manage traditional Mediterranean wood pasture combining grazing with acorn harvest.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 130, estimated_co2_kg_impact: 68, location: "Oak woodland, Western Spain", is_active: true },
  { title: "Establish windbreak with fast-growing species", description: "Plant poplar or willow rows to protect crops from erosive winds.", category: "agroforestry", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 48, estimated_co2_kg_impact: 38, location: "Exposed farmland, Denmark", is_active: true },
  { title: "Plant chestnut trees for food forestry", description: "Establish productive nut trees that provide sustainable food while restoring forest ecosystems.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 135, reward_credits: 72, estimated_co2_kg_impact: 50, location: "Mountain slopes, Southern Italy", is_active: true },
  { title: "Integrate poultry into orchard system", description: "Set up mobile coops allowing chickens to fertilize and pest-control under fruit trees.", category: "agroforestry", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 45, estimated_co2_kg_impact: 20, location: "Small farm, Southern Germany", is_active: true },
  { title: "Establish hazelnut hedgerows for wildlife corridors", description: "Plant productive nut bushes that connect forest patches and support biodiversity.", category: "agroforestry", difficulty_level: "Beginner", estimated_duration_minutes: 105, reward_credits: 58, estimated_co2_kg_impact: 35, location: "Farmland, Southern Sweden", is_active: true },
  { title: "Create medicinal herb layer under fruit trees", description: "Cultivate valuable herbs in the shade of orchard canopy for diversified income.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 90, reward_credits: 55, estimated_co2_kg_impact: 22, location: "Herbal farm, Albania", is_active: true },
  { title: "Plant bamboo for erosion control and biomass", description: "Establish fast-growing bamboo groves on steep slopes for soil protection and sustainable harvest.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 68, estimated_co2_kg_impact: 42, location: "Hillside property, Northern Portugal", is_active: true },
  { title: "Integrate mushroom cultivation in woodland farm", description: "Inoculate logs with edible fungi as understory production in tree systems.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 150, reward_credits: 85, estimated_co2_kg_impact: 28, location: "Forest farm, Slovenia", is_active: true },
  { title: "Establish fodder tree system for livestock", description: "Plant nutrient-rich trees like mulberry for browsing animals to supplement grazing.", category: "agroforestry", difficulty_level: "Intermediate", estimated_duration_minutes: 135, reward_credits: 70, estimated_co2_kg_impact: 45, location: "Pastoral land, Romania", is_active: true },
  { title: "Create taungya system with vegetables under young trees", description: "Grow annual crops between newly planted trees during establishment phase.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 180, reward_credits: 95, estimated_co2_kg_impact: 48, location: "Reforestation site, Poland", is_active: true },
  { title: "Plant multi-story tropical greenhouse system", description: "Design intensive indoor growing combining vining crops with dwarf fruit trees.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 165, reward_credits: 88, estimated_co2_kg_impact: 35, location: "Greenhouse complex, Netherlands", is_active: true },
  { title: "Establish cork oak management system", description: "Plant and train cork trees for sustainable bark harvest every 9 years.", category: "agroforestry", difficulty_level: "Advanced", estimated_duration_minutes: 195, reward_credits: 105, estimated_co2_kg_impact: 58, location: "Cork forest, Southern Portugal", is_active: true },

  // Home Insulation (20 jobs)
  { title: "Inspect apartment block windows for draft leaks", description: "Check weatherstripping and seals on all units, document problem areas for repair.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 90, reward_credits: 45, estimated_co2_kg_impact: 35, location: "Urban district, Tirana, Albania", is_active: true },
  { title: "Install attic insulation in residential home", description: "Lay mineral wool or cellulose insulation between roof joists to reduce heat loss.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 95, estimated_co2_kg_impact: 65, location: "Suburban house, Northern Germany", is_active: true },
  { title: "Seal air leaks around windows and doors", description: "Apply weatherstripping and caulk to eliminate drafts and improve comfort.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 42, estimated_co2_kg_impact: 40, location: "Older home, Dublin, Ireland", is_active: true },
  { title: "Insulate hot water pipes to reduce heat loss", description: "Wrap foam sleeves around exposed plumbing to improve water heating efficiency.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 32, estimated_co2_kg_impact: 25, location: "Apartment building, Vienna, Austria", is_active: true },
  { title: "Install reflective barriers in unheated attic", description: "Attach radiant foil to reduce summer cooling loads and winter heat loss.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 120, reward_credits: 68, estimated_co2_kg_impact: 45, location: "Single-family home, Athens, Greece", is_active: true },
  { title: "Insulate basement walls and rim joists", description: "Apply rigid foam or spray insulation to foundation areas preventing heat escape.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 115, estimated_co2_kg_impact: 70, location: "Older house, Oslo, Norway", is_active: true },
  { title: "Install thermal curtains and window films", description: "Hang insulated drapes and apply low-e films to improve window performance.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 45, reward_credits: 28, estimated_co2_kg_impact: 18, location: "Apartment, Budapest, Hungary", is_active: true },
  { title: "Seal ductwork in unconditioned spaces", description: "Tape and mastic-seal heating/cooling ducts to prevent air leakage losses.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 135, reward_credits: 75, estimated_co2_kg_impact: 55, location: "Residential property, Belgium", is_active: true },
  { title: "Blow cellulose insulation into wall cavities", description: "Dense-pack loose-fill insulation into hollow walls from exterior or interior access.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 135, estimated_co2_kg_impact: 75, location: "Historic building, Prague, Czech Republic", is_active: true },
  { title: "Install door sweeps and threshold seals", description: "Attach bottom door seals to eliminate air infiltration under entry doors.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 30, reward_credits: 22, estimated_co2_kg_impact: 15, location: "Row house, Amsterdam, Netherlands", is_active: true },
  { title: "Insulate garage doors to reduce heat loss", description: "Attach rigid foam panels to uninsulated metal overhead doors.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 40, estimated_co2_kg_impact: 32, location: "Detached house, Stockholm, Sweden", is_active: true },
  { title: "Apply exterior foam board to building walls", description: "Install continuous insulation sheathing on building exterior before re-siding.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 140, estimated_co2_kg_impact: 80, location: "Renovation project, Poland", is_active: true },
  { title: "Seal penetrations in building envelope", description: "Foam and caulk all holes where pipes, wires and vents pass through walls.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 90, reward_credits: 52, estimated_co2_kg_impact: 38, location: "Multi-unit building, Milan, Italy", is_active: true },
  { title: "Install insulated window shutters", description: "Mount interior or exterior shutters that provide nighttime insulation boost.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 105, reward_credits: 60, estimated_co2_kg_impact: 42, location: "Traditional home, Southern France", is_active: true },
  { title: "Upgrade attic access hatch insulation", description: "Build insulated cover for pull-down stairs or scuttle hole preventing heat loss.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 60, reward_credits: 35, estimated_co2_kg_impact: 28, location: "Residential house, Denmark", is_active: true },
  { title: "Insulate behind electrical outlets and switches", description: "Install foam gaskets and pads to seal penetrations in walls.", category: "home_insulation", difficulty_level: "Beginner", estimated_duration_minutes: 75, reward_credits: 38, estimated_co2_kg_impact: 22, location: "Apartment renovation, Spain", is_active: true },
  { title: "Install high R-value rigid foam in flat roof", description: "Layer rigid insulation boards on commercial building roof for maximum performance.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 240, reward_credits: 145, estimated_co2_kg_impact: 78, location: "Commercial building, Finland", is_active: true },
  { title: "Perform blower door test and seal leaks", description: "Use diagnostic equipment to find hidden air leakage paths and seal them.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 165, reward_credits: 95, estimated_co2_kg_impact: 60, location: "Energy audit, Switzerland", is_active: true },
  { title: "Insulate crawlspace walls and floors", description: "Apply insulation to underfloor areas preventing cold drafts and frozen pipes.", category: "home_insulation", difficulty_level: "Intermediate", estimated_duration_minutes: 180, reward_credits: 98, estimated_co2_kg_impact: 62, location: "Raised home, Coastal UK", is_active: true },
  { title: "Install thermal breaks in metal-framed building", description: "Retrofit insulating spacers to interrupt thermal bridging through aluminum frames.", category: "home_insulation", difficulty_level: "Advanced", estimated_duration_minutes: 210, reward_credits: 125, estimated_co2_kg_impact: 68, location: "Office building, Luxembourg", is_active: true },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body if present
    let body = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
        const validation = requestSchema.safeParse(body);
        
        if (!validation.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (e) {
      // Empty body is acceptable
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking existing micro-jobs...');

    // Check how many jobs exist
    const { count } = await supabase
      .from('micro_jobs')
      .select('*', { count: 'exact', head: true });

    console.log(`Found ${count} existing micro-jobs`);

    // Only seed if fewer than 20 jobs exist
    if (count && count >= 20) {
      return new Response(
        JSON.stringify({ 
          message: 'Database already has sufficient micro-jobs', 
          existingCount: count 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Inserting seed data...');

    // Insert all jobs
    const { data: insertedJobs, error: jobError } = await supabase
      .from('micro_jobs')
      .insert(SEED_JOBS)
      .select();

    if (jobError) {
      console.error('Error inserting jobs:', jobError);
      throw jobError;
    }

    console.log(`Inserted ${insertedJobs.length} jobs`);

    // Create training modules and quiz questions for each job
    const trainingModules = [];
    const quizQuestions = [];

    for (const job of insertedJobs) {
      // Create training module
      const module = {
        microjob_id: job.id,
        title: `${job.title} - Training Guide`,
        content: `This training module will prepare you for the ${job.title} task.

**Overview**: ${job.description}

**Key Skills Required**:
- Understanding of ${job.category.replace('_', ' ')} principles
- Safety awareness and proper equipment use
- Attention to detail and quality workmanship

**Environmental Impact**: This job contributes approximately ${job.estimated_co2_kg_impact} kg CO₂ equivalent in climate benefits.

**Duration**: Expect to spend about ${job.estimated_duration_minutes} minutes on this task.

**Safety Considerations**: Always follow local safety guidelines, use appropriate personal protective equipment, and work within your skill level.`,
        learning_objectives: [
          `Understand the importance of ${job.category.replace('_', ' ')} for climate resilience`,
          'Follow proper safety procedures',
          'Complete work to quality standards',
          'Document results accurately'
        ]
      };

      trainingModules.push(module);
    }

    const { data: insertedModules, error: moduleError } = await supabase
      .from('training_modules')
      .insert(trainingModules)
      .select();

    if (moduleError) {
      console.error('Error inserting modules:', moduleError);
      throw moduleError;
    }

    console.log(`Inserted ${insertedModules.length} training modules`);

    // Create quiz questions for each module
    for (const module of insertedModules) {
      const questions = [
        {
          training_module_id: module.id,
          question_text: 'What is the primary environmental benefit of this task?',
          option_a: 'It looks nice',
          option_b: 'It reduces carbon emissions or improves climate resilience',
          option_c: 'It costs less money',
          option_d: 'It requires no skills',
          correct_option: 'B'
        },
        {
          training_module_id: module.id,
          question_text: 'What safety precautions should you take before starting?',
          option_a: 'No preparation needed',
          option_b: 'Check weather and wear proper safety equipment',
          option_c: 'Work as fast as possible',
          option_d: 'Skip the training module',
          correct_option: 'B'
        },
        {
          training_module_id: module.id,
          question_text: 'Why is quality important in climate resilience work?',
          option_a: 'It ensures long-term effectiveness and impact',
          option_b: 'It makes photos look better',
          option_c: 'It is not important',
          option_d: 'Only speed matters',
          correct_option: 'A'
        },
        {
          training_module_id: module.id,
          question_text: 'What should you do if you encounter unexpected difficulties?',
          option_a: 'Give up immediately',
          option_b: 'Proceed unsafely',
          option_c: 'Ask for help or guidance from supervisors',
          option_d: 'Ignore the problem',
          correct_option: 'C'
        }
      ];

      quizQuestions.push(...questions);
    }

    const { error: questionError } = await supabase
      .from('quiz_questions')
      .insert(quizQuestions);

    if (questionError) {
      console.error('Error inserting questions:', questionError);
      throw questionError;
    }

    console.log(`Inserted ${quizQuestions.length} quiz questions`);

    return new Response(
      JSON.stringify({ 
        success: true,
        jobsCreated: insertedJobs.length,
        modulesCreated: insertedModules.length,
        questionsCreated: quizQuestions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seeding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
